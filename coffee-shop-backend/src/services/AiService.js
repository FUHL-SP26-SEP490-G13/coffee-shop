const { GoogleGenAI, Type } = require("@google/genai");
const productService = require("./ProductService");
const discountService = require("./DiscountService");

class AiService {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.model = process.env.GEMINI_MODEL_PRIMARY || process.env.GEMINI_MODEL || "gemini-2.5-flash";

    this.lastCallMap = new Map();
    this.responseCache = new Map();
    this.sessionState = new Map();

    this.cacheTtlMs = 2 * 60 * 1000;
    this.cooldownMs = 500;
    this.stateTtlMs = 30 * 60 * 1000;
  }

  normalizeText(text) {
    return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  buildCacheKey(sessionId, message) {
    return `${sessionId}::${this.normalizeText(message)}`;
  }

  getCachedResponse(cacheKey) {
    const item = this.responseCache.get(cacheKey);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.responseCache.delete(cacheKey);
      return null;
    }
    return item.value;
  }

  setCachedResponse(cacheKey, value) {
    this.responseCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  isCoolingDown(sessionId) {
    const now = Date.now();
    const lastCall = this.lastCallMap.get(sessionId) || 0;
    if (now - lastCall < this.cooldownMs) return true;
    this.lastCallMap.set(sessionId, now);
    return false;
  }

  trimHistory(history = [], maxMessages = 8) {
    return history.slice(-maxMessages).map((msg) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: String(msg.text || "") }],
    }));
  }

  getSessionState(sessionId) {
    const item = this.sessionState.get(sessionId);
    if (!item) {
      return {
        lastSuggestedProducts: [],
        lastSuggestedText: "",
        userPreference: "",
        lastIntent: "",
        pendingProduct: null,
      };
    }

    if (Date.now() > item.expiresAt) {
      this.sessionState.delete(sessionId);
      return {
        lastSuggestedProducts: [],
        lastSuggestedText: "",
        userPreference: "",
        lastIntent: "",
        pendingProduct: null,
      };
    }

    return item.value;
  }

  setSessionState(sessionId, nextState) {
    this.sessionState.set(sessionId, {
      value: nextState,
      expiresAt: Date.now() + this.stateTtlMs,
    });
  }

  updateSessionState(sessionId, patch) {
    const current = this.getSessionState(sessionId);
    const next = { ...current, ...patch };
    this.setSessionState(sessionId, next);
    return next;
  }

  formatPrice(price) {
    if (price === null || price === undefined || price === "") return "Liên hệ";
    const num = Number(price);
    if (Number.isNaN(num)) return String(price);
    return `${num.toLocaleString("vi-VN")}đ`;
  }

  getProductCartInfo(product, requestedSize = "S") {
    let price = Number(product.price || product.base_price || product.basePrice || 0);
    let sizeName = "S";
    let sizeId = 0;
    
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      const validSizes = product.sizes.filter(s => Number.isFinite(Number(s.price)) && Number(s.price) > 0);
      if (validSizes.length > 0) {
         validSizes.sort((a, b) => Number(a.price) - Number(b.price));
         const safeReq = String(requestedSize || 'S').trim().toUpperCase();
         const matchedSize = validSizes.find(s => String(s.size || '').trim().toUpperCase() === safeReq);
         const targetSize = matchedSize || validSizes[0];
         price = Number(targetSize.price);
         sizeName = targetSize.size || "S";
         sizeId = targetSize.id || 0;
      }
    }
    
    const image = product.images?.find(img => img.isThumbnail === 1)?.image_url || product.images?.[0]?.image_url || "";
    
    return { price, sizeName, sizeId, image };
  }

  formatMenuItems(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
      return "Hiện tại chưa có sản phẩm phù hợp nhé.";
    }

    return items
      .map((p, index) => {
        let price = p.price ?? p.basePrice ?? p.base_price;
        if (!price && Array.isArray(p.sizes) && p.sizes.length > 0) {
          const validPrices = p.sizes.map(s => Number(s.price)).filter(val => Number.isFinite(val) && val > 0);
          if (validPrices.length > 0) {
            price = Math.min(...validPrices);
          }
        }
        return `${index + 1}. ${p.name} - ${this.formatPrice(price)}`;
      })
      .join("\n");
  }

  formatDiscounts(discounts = []) {
    if (!Array.isArray(discounts) || discounts.length === 0) {
      return "Hiện tại quán chưa có khuyến mãi nào nhé.";
    }

    return discounts
      .map((d) => {
        const title =
          Number(d.percentage) > 0
            ? `giảm ${Number(d.percentage)}%`
            : Number(d.max_discount_amount) > 0
              ? `giảm ${Number(d.max_discount_amount).toLocaleString("vi-VN")}đ`
              : "ưu đãi đặc biệt";

        const extra =
          Number(d.min_order_amount) > 0
            ? `, áp dụng từ ${Number(d.min_order_amount).toLocaleString("vi-VN")}đ`
            : "";

        return `- Mã ${d.code}: ${title}${extra}`;
      })
      .join("\n");
  }

  detectIntent(message) {
    const text = this.normalizeText(message);

    return {
      askDiscount:
        /khuyến mãi|khuyen mai|mã giảm giá|ma giam gia|voucher|coupon|ưu đãi|uu dai/.test(text),

      askMenu:
        /menu|thực đơn|thuc don|đồ uống|do uong|nước uống|nuoc uong|cà phê|ca phe|\btrà\b|\btra\b|\bbánh\b|\bbanh\b|món|sản phẩm/.test(text),

      askAddToCart:
        /thêm vào giỏ|them vao gio|vào giỏ|mua luôn|đặt món|dat mon|lấy cho|lay cho|chốt món|chot mon|mua món|cho 1|cho 2|cho 3/.test(text),

      askByIndex:
        /món thứ \d+|mon thu \d+|số \d+|so \d+|mục \d+|muc \d+/.test(text),

      askById:
        /\[\d+\]|id\s*:?\s*\d+/.test(text),

      askStore:
        /mở cửa|mo cua|đóng cửa|dong cua|mấy giờ|may gio|thông tin quán|thong tin quan|địa chỉ|dia chi|hotline/.test(text),

      raw: text,
    };
  }

  extractKeywordForMenu(message) {
    let text = this.normalizeText(message);

    const stopWords = [
      "menu", "thực đơn", "thuc don", "đồ uống", "do uong", "nước uống", "nuoc uong",
      "cà phê", "ca phe", "trà", "tra", "bánh", "banh", "món", "cho tôi xem",
      "gợi ý", "goi y", "có gì", "co gi", "hôm nay", "hom nay",
    ];

    for (const word of stopWords) {
      text = text.replaceAll(word, " ");
    }

    return text.replace(/\s+/g, " ").trim();
  }

  extractIndex(message) {
    const text = this.normalizeText(message);
    const match =
      text.match(/món thứ (\d+)/) ||
      text.match(/mon thu (\d+)/) ||
      text.match(/số (\d+)/) ||
      text.match(/so (\d+)/) ||
      text.match(/mục (\d+)/) ||
      text.match(/muc (\d+)/);

    if (!match) return null;
    const index = Number(match[1]);
    return Number.isInteger(index) && index > 0 ? index : null;
  }

  extractProductId(message) {
    const text = this.normalizeText(message);
    const match =
      text.match(/\[(\d+)\]/) ||
      text.match(/id\s*:?\s*(\d+)/);

    if (!match) return null;
    const id = Number(match[1]);
    return Number.isInteger(id) ? id : null;
  }

  extractQuantity(message) {
    const text = this.normalizeText(message);
    const match =
      text.match(/(\d+)\s*(ly|cốc|coc|phần|phan|cái|cai)/) ||
      text.match(/số lượng\s*(\d+)/) ||
      text.match(/so luong\s*(\d+)/) ||
      text.match(/thêm\s+(\d+)/) ||
      text.match(/cho\s+(\d+)/) ||
      text.match(/lấy\s+(\d+)/) ||
      text.match(/đặt\s+(\d+)/) ||
      text.match(/mua\s+(\d+)/) ||
      text.match(/x\s*(\d+)/);

    if (!match) return 1;
    const qty = Number(match[1]);
    return Number.isInteger(qty) && qty > 0 ? qty : 1;
  }

  inferPreference(message) {
    const text = this.normalizeText(message);

    if (/ngọt|ngot/.test(text)) return "đồ ngọt";
    if (/đắng|dang|ít ngọt|it ngot/.test(text)) return "ít ngọt";
    if (/nóng|nong/.test(text)) return "đồ nóng";
    if (/lạnh|lanh|đá|da/.test(text)) return "đồ lạnh";
    if (/cà phê|ca phe/.test(text)) return "cà phê";
    if (/trà|tra/.test(text)) return "trà";

    return "";
  }

  async handleDirectDiscountIntent(sessionId) {
    const discounts = await discountService.getPublic();
    this.updateSessionState(sessionId, { lastIntent: "discount" });

    return {
      type: "message",
      text: this.formatDiscounts(discounts),
    };
  }

  async handleDirectMenuIntent(sessionId, userMessage) {
    const keyword = this.extractKeywordForMenu(userMessage);
    let items = [];
    let title = "Đây là một số món phù hợp nhé:";

    if (keyword && keyword !== "sản phẩm" && keyword !== "các sản phẩm ở cửa hàng") {
      const result = await productService.searchProducts(keyword, { limit: 8, page: 1 });
      items = result?.data || result?.items || result || [];
    }

    if (!items || items.length === 0) {
      const result = await productService.searchProducts("", { limit: 12, page: 1 });
      items = result?.data || result?.items || result || [];
      title = "Danh sách các sản phẩm ở cửa hàng:";
    }

    const preference = this.inferPreference(userMessage);
    this.updateSessionState(sessionId, {
      lastIntent: "menu",
      lastSuggestedProducts: Array.isArray(items) ? items : [],
      lastSuggestedText: userMessage,
      userPreference: preference || this.getSessionState(sessionId).userPreference,
    });

    return {
      type: "message",
      text: `${title}\n${this.formatMenuItems(items)}`,
    };
  }

  async handleSelectFromState(sessionId, userMessage) {
    const state = this.getSessionState(sessionId);
    const quantity = this.extractQuantity(userMessage);

    const index = this.extractIndex(userMessage);
    if (index && state.lastSuggestedProducts[index - 1]) {
      const product = state.lastSuggestedProducts[index - 1];
      this.updateSessionState(sessionId, {
        pendingProduct: product,
        lastIntent: "select_product",
      });

      if (/thêm vào giỏ|them vao gio|mua luôn|đặt món|dat mon|chốt|chot/.test(this.normalizeText(userMessage))) {
        const { price, sizeName, sizeId, image } = this.getProductCartInfo(product);

        return {
          type: "action",
          action: {
            type: "add_to_cart_multiple",
            payload: [{
              product_id: product.id,
              product_name: product.name,
              price: price,
              size: sizeName,
              productSizeId: sizeId,
              image: image,
              quantity,
            }],
          },
          text: `Mình đã thêm ${quantity} x ${product.name} vào giỏ hàng cho bạn nhé!`,
        };
      }

      return {
        type: "message",
        text: `Bạn đang chọn ${product.name}. Nếu muốn mình có thể thêm ${quantity} sản phẩm này vào giỏ cho bạn.`,
      };
    }

    const productId = this.extractProductId(userMessage);
    if (productId) {
      const product = state.lastSuggestedProducts.find((p) => Number(p.id) === productId);
      if (product) {
        this.updateSessionState(sessionId, {
          pendingProduct: product,
          lastIntent: "select_product",
        });

        if (/thêm vào giỏ|them vao gio|mua luôn|đặt món|dat mon|chốt|chot/.test(this.normalizeText(userMessage))) {
          const { price, sizeName, sizeId, image } = this.getProductCartInfo(product);

          return {
            type: "action",
            action: {
              type: "add_to_cart_multiple",
              payload: [{
                product_id: product.id,
                product_name: product.name,
                price: price,
                size: sizeName,
                productSizeId: sizeId,
                image: image,
                quantity,
              }],
            },
            text: `Mình đã thêm ${quantity} x ${product.name} vào giỏ hàng cho bạn nhé!`,
          };
        }

        return {
          type: "message",
          text: `Bạn đang chọn ${product.name}. Mình có thể thêm vào giỏ ngay nếu bạn muốn.`,
        };
      }
    }

    return null;
  }

  buildTools() {
    return [
      {
        name: "get_menu",
        description: "Tra cứu danh sách menu hiện tại của quán Cà Phê Việt.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            keyword: {
              type: Type.STRING,
              description: "Từ khóa tìm kiếm món hoặc danh mục, có thể để trống",
            },
          },
        },
      },
      {
        name: "get_discounts",
        description: "Xem mã giảm giá hoặc khuyến mãi đang hoạt động.",
      },
      {
        name: "get_store_info",
        description: "Lấy thông tin chung của quán như Giờ Mở Cửa, Đóng Cửa, Hotline, Địa chỉ, Phí ship.",
      },
      {
        name: "add_items_to_cart",
        description: "Thêm MỘT HOẶC NHIỀU sản phẩm vào giỏ hàng khi khách yêu cầu. Có thể truyền mảng gồm nhiều món khác nhau.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  product_id: { type: Type.INTEGER },
                  product_name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  quantity: { type: Type.INTEGER },
                  size: { type: Type.STRING, description: "Size S, M, hoặc L (mặc định S)" },
                  note: { type: Type.STRING, description: "Ghi chú tùy chỉnh của khách (ít đá, trân châu...)" }
                },
                required: ["product_id", "product_name", "quantity"]
              }
            }
          },
          required: ["items"],
        },
      },
    ];
  }

  buildConfig(sessionState) {
    const stateSummary = [
      sessionState.userPreference ? `Sở thích gần đây: ${sessionState.userPreference}.` : "",
      sessionState.pendingProduct ? `Đang quan tâm: [${sessionState.pendingProduct.id}] ${sessionState.pendingProduct.name}.` : "",
      sessionState.lastSuggestedProducts?.length
        ? `Đã gợi ý ${sessionState.lastSuggestedProducts.length} món.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      systemInstruction: {
        parts: [{
          text:
            `Bạn tên là "Trợ Lý Cà Phê" của hệ thống "Cà Phê Việt". ` +
            `Tính cách: Trẻ trung, thân thiện, lịch sự, thỉnh thoảng dùng emoji 😊☕. Tuyệt đối xưng "mình" và gọi "bạn". ` +
            `Luôn trả lời ngắn gọn, xuống dòng hợp lý dễ nhìn. ` +
            `QUAN TRỌNG: LUÔN bôi đậm tên món ăn, giá tiền, hoặc mã đơn bằng thẻ Markdown (ví dụ: **Cà phê đen** - **30.000đ**). ` +
            `Khi khách đặt nhiều món, hãy trích xuất toàn bộ sang dạng mảng rôi gọi \`add_items_to_cart\`. ` +
            `NẾU khách hỏi chủ đề KHÔNG TRỌNG TÂM, hãy khéo léo từ chối và hướng về đồ uống. ` +
            `Ngữ cảnh của khách: ${stateSummary}`
        }],
      },
      tools: [{
        functionDeclarations: this.buildTools(),
      }],
    };
  }

  async callModel(contents, config) {
    const modelsToTry = [
      this.model || "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    // Lọc trùng lặp model
    const uniqueModels = [...new Set(modelsToTry)];
    let lastError = null;

    for (const modelName of uniqueModels) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });
        return response;
      } catch (error) {
        lastError = error;
        const msg = String(error?.message || "");
        if (
          error?.status === 429 ||
          msg.includes("429") ||
          msg.includes("Quota") ||
          error?.status === 503 ||
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          error?.status === 404 ||
          msg.includes("404") ||
          msg.includes("not found")
        ) {
          console.warn(`[AiService] Model ${modelName} failed (${error?.status || msg}). Switching to next model...`);
          continue;
        }
        // Lỗi logic (Bad Request, v.v.) thì dừng luôn
        throw error;
      }
    }

    throw lastError;
  }

  async executeFunctionCall(call, chatContents, config, sessionId) {
    if (call.name === "get_menu") {
      const keyword = String(call.args?.keyword || "").trim();
      const result = await productService.searchProducts(keyword, { limit: 12, page: 1 });
      const items = result?.data || result?.items || result || [];
      const menuString = this.formatMenuItems(items);

      this.updateSessionState(sessionId, {
        lastIntent: "menu",
        lastSuggestedProducts: Array.isArray(items) ? items : [],
        lastSuggestedText: keyword,
      });

      chatContents.push({ role: "model", parts: [{ functionCall: call }] });
      chatContents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: "get_menu",
            response: { 
              result: items.map(p => {
                let pPrice = p.price || p.base_price || p.basePrice || 0;
                if (!pPrice && Array.isArray(p.sizes) && p.sizes.length > 0) {
                  const validPrices = p.sizes.map(s => Number(s.price)).filter(val => Number.isFinite(val) && val > 0);
                  if (validPrices.length > 0) pPrice = Math.min(...validPrices);
                }
                return {
                  id: p.id,
                  name: p.name,
                  price: pPrice
                };
              })
            },
          },
        }],
      });

      const finalResponse = await this.callModel(chatContents, config);
      
      if (finalResponse.functionCalls && finalResponse.functionCalls.length > 0) {
        return this.executeFunctionCall(finalResponse.functionCalls[0], chatContents, config, sessionId);
      }
      
      return {
        type: "message",
        text: finalResponse.text || "Mình đã tìm menu nhưng chưa thể tìm ra kết quả cuối cùng.",
      };
    }

    if (call.name === "get_discounts") {
      const discounts = await discountService.getPublic();
      const discountString = this.formatDiscounts(discounts);

      this.updateSessionState(sessionId, {
        lastIntent: "discount",
      });

      chatContents.push({ role: "model", parts: [{ functionCall: call }] });
      chatContents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: "get_discounts",
            response: { result: discounts },
          },
        }],
      });

      const finalResponse = await this.callModel(chatContents, config);
      
      if (finalResponse.functionCalls && finalResponse.functionCalls.length > 0) {
        return this.executeFunctionCall(finalResponse.functionCalls[0], chatContents, config, sessionId);
      }
      
      return {
        type: "message",
        text: finalResponse.text || "Mình đã kiểm tra khuyến mãi nhưng chưa thể phản hồi rõ ràng.",
      };
    }

    if (call.name === "add_items_to_cart") {
      const callItems = call.args?.items || [];
      const payloadArray = [];
      const textNames = [];

      for (const item of callItems) {
        let finalPrice = item.price || 0;
        let sizeName = item.size || "S";
        let sizeId = 0;
        let imageUrl = "";
        let validProduct = null;
        let finalProductId = item.product_id;
        let finalProductName = item.product_name;

        if (item.product_id || item.product_name) {
          try {
            if (item.product_id) {
              validProduct = await productService.getProductById(item.product_id).catch(() => null);
            }
            if (!validProduct && item.product_name) {
              const result = await productService.searchProducts(item.product_name, { limit: 1 });
              const items = result?.data || result?.items || result || [];
              if (items.length > 0) validProduct = items[0];
            }
          } catch (e) {}
        }

        if (!validProduct) {
          return {
            type: "message",
            text: `Xin lỗi bạn, quán mình hiện tại không có món "${item.product_name}" trong menu. Bạn vui lòng xem menu để chọn món khác nhé!`,
          };
        }

        const info = this.getProductCartInfo(validProduct, sizeName);
        finalPrice = info.price || finalPrice;
        sizeName = info.sizeName;
        sizeId = info.sizeId;
        imageUrl = info.image;
        finalProductId = validProduct.id;
        finalProductName = validProduct.name;

        payloadArray.push({
          product_id: finalProductId,
          product_name: finalProductName,
          price: finalPrice,
          size: sizeName,
          productSizeId: sizeId,
          image: imageUrl,
          quantity: item.quantity || 1,
          note: item.note || ""
        });
        textNames.push(`${item.quantity || 1} x ${finalProductName} (${sizeName})`);
      }

      return {
        type: "action",
        action: {
          type: "add_to_cart_multiple",
          payload: payloadArray,
        },
        text: `Mình đã gửi yêu cầu thêm: **${textNames.join(", ")}** vào giỏ hàng của bạn rồi nhé!`,
      };
    }

    if (call.name === "get_store_info") {
      let storeInfo = {
        name: "Cà Phê Việt",
        address: "Đang cập nhật",
        openTime: "07:00",
        closeTime: "22:30",
        hotline: "Đang cập nhật",
        shippingFee: "20.000 VNĐ (Áp dụng cho mọi đơn giao hàng)",
      };

      try {
        const receiptSettingService = require("./ReceiptSettingService");
        const setting = await receiptSettingService.getActiveSetting();
        if (setting) {
          storeInfo.name = setting.store_name || storeInfo.name;
          storeInfo.address = setting.address || storeInfo.address;
          storeInfo.openTime = setting.open_time || storeInfo.openTime;
          storeInfo.closeTime = setting.close_time || storeInfo.closeTime;
          storeInfo.hotline = setting.phone || storeInfo.hotline;
        }
      } catch (e) {
        console.error("Error fetching store info:", e);
      }

      chatContents.push({ role: "model", parts: [{ functionCall: call }] });
      chatContents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: "get_store_info",
            response: { result: storeInfo },
          },
        }],
      });

      const finalResponse = await this.callModel(chatContents, config);
      if (finalResponse.functionCalls && finalResponse.functionCalls.length > 0) {
        return this.executeFunctionCall(finalResponse.functionCalls[0], chatContents, config, sessionId);
      }
      return { type: "message", text: finalResponse.text };
    }

    return {
      type: "message",
      text: "Xin lỗi, mình chưa hỗ trợ yêu cầu này.",
    };
  }

  async processChat(history, userMessage, sessionId = "guest") {
    const safeMessage = String(userMessage || "").trim();

    if (!safeMessage) {
      return {
        type: "message",
        text: "Bạn muốn mình hỗ trợ gì về menu hoặc khuyến mãi nhé?",
      };
    }

    const cacheKey = this.buildCacheKey(sessionId, safeMessage);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    try {
      const intent = this.detectIntent(safeMessage);

      const preference = this.inferPreference(safeMessage);
      if (preference) {
        this.updateSessionState(sessionId, { userPreference: preference });
      }

      if (intent.askDiscount && !intent.askAddToCart && !intent.askStore) {
        const result = await this.handleDirectDiscountIntent(sessionId);
        this.setCachedResponse(cacheKey, result);
        return result;
      }

      if (intent.askMenu && !intent.askAddToCart && !intent.askByIndex && !intent.askById && !intent.askStore) {
        const result = await this.handleDirectMenuIntent(sessionId, safeMessage);
        this.setCachedResponse(cacheKey, result);
        return result;
      }

      if (intent.askByIndex || intent.askById) {
        const stateResult = await this.handleSelectFromState(sessionId, safeMessage);
        if (stateResult) return stateResult;
      }

      if (intent.askAddToCart && !intent.askByIndex && !intent.askById) {
         let searchKeyword = this.normalizeText(safeMessage);
         const removeWords = [
           "thêm vào", "vào giỏ hàng", "vào giỏ", "cho", "ly", "cốc", "phần", "mua",
           "lấy", "tôi", "mình", "đặt", "chốt", "món", "1", "2", "3", "4", "5", "6", "7", "8", "9",
           "hàng", "một", "hai", "ba"
         ];
         removeWords.forEach(w => {
           searchKeyword = searchKeyword.replaceAll(w, " ");
         });
         searchKeyword = searchKeyword.replace(/\s+/g, " ").trim();

         if (searchKeyword.length >= 2) {
           const result = await productService.searchProducts(searchKeyword, { limit: 1 });
           const items = result?.data || result?.items || result || [];
           if (items.length > 0) {
             const product = items[0];
             const quantity = this.extractQuantity(safeMessage);
             const { price, sizeName, sizeId, image } = this.getProductCartInfo(product);
             
             this.updateSessionState(sessionId, {
               pendingProduct: product,
               lastIntent: "add_to_cart",
             });

             const resObj = {
               type: "action",
               action: {
                 type: "add_to_cart_multiple",
                 payload: [{
                   product_id: product.id,
                   product_name: product.name,
                   price,
                   size: sizeName,
                   productSizeId: sizeId,
                   image,
                   quantity,
                 }],
               },
               text: `Mình đã thêm ${quantity} x ${product.name} vào giỏ hàng cho bạn nhé!`,
             };
             this.setCachedResponse(cacheKey, resObj);
             return resObj;
           }
         }
      }

      if (this.isCoolingDown(sessionId)) {
        return {
          type: "message",
          text: "Bạn gửi hơi nhanh, chờ mình một chút rồi nhắn tiếp nhé!",
        };
      }

      const state = this.getSessionState(sessionId);
      const chatContents = this.trimHistory(history, 8);
      chatContents.push({
        role: "user",
        parts: [{ text: safeMessage }],
      });

      const config = this.buildConfig(state);
      const response = await this.callModel(chatContents, config);

      if (response.functionCalls && response.functionCalls.length > 0) {
        const result = await this.executeFunctionCall(
          response.functionCalls[0],
          chatContents,
          config,
          sessionId
        );

        if (result?.type === "message") {
          this.setCachedResponse(cacheKey, result);
        }
        return result;
      }

      const finalText =
        response.text || "Xin lỗi, mình chưa thể xử lý yêu cầu này lúc này.";

      const result = { type: "message", text: finalText };
      this.setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      console.error("AI Error:", error);

      if (error?.status === 429) {
        return {
          type: "message",
          text: "Mình đang chạm giới hạn AI tạm thời, bạn thử lại sau ít phút nhé!",
        };
      }

      return {
        type: "message",
        text: "Hệ thống AI đang bận, bạn thử lại sau một chút nhé!",
      };
    }
  }
}

module.exports = new AiService();

/*
user nói “cho tôi xem menu trà” → gọi DB trực tiếp, không tốn AI
user nói “lấy món thứ 2” → lấy từ lastSuggestedProducts, không cần AI nhớ toàn bộ history
user nói “thêm 2 ly món đó vào giỏ” → có thể xử lý từ state
chỉ khi câu hỏi mơ hồ hoặc phức tạp mới gọi Gemini

*/
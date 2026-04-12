const { GoogleGenAI } = require("@google/genai");

class NewsAIService {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // model chính + model dự phòng
    this.primaryModel = process.env.GEMINI_MODEL_PRIMARY || "gemini-2.5-flash";
    this.fallbackModel =
      process.env.GEMINI_MODEL_FALLBACK || "gemini-2.0-flash";
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isRetryableError(error) {
    const raw = error?.message || "";
    return (
      raw.includes('"code":503') ||
      raw.includes('"status":"UNAVAILABLE"') ||
      raw.includes("503") ||
      raw.includes("UNAVAILABLE")
    );
  }

  async generateWithRetry({ model, contents, config, maxRetries = 3 }) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents,
          config,
        });

        return response;
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error) || attempt === maxRetries) {
          throw error;
        }

        // exponential backoff: 1s -> 2s -> 4s ...
        const delay = 1000 * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  async generateRobust({ contents, config }) {
    try {
      return await this.generateWithRetry({
        model: this.primaryModel,
        contents,
        config,
        maxRetries: 3,
      });
    } catch (error) {
      if (!this.isRetryableError(error)) {
        throw error;
      }

      // fallback model nếu model chính đang quá tải
      return await this.generateWithRetry({
        model: this.fallbackModel,
        contents,
        config,
        maxRetries: 2,
      });
    }
  }

  async suggestFromTitle(title) {
    const prompt = `
Bạn là biên tập viên blog chuyên nghiệp cho một website quán cà phê.

Nhiệm vụ: Dựa trên tiêu đề bài viết, hãy sáng tạo nội dung chi tiết.

Tiêu đề: "${title}"

Yêu cầu đầu ra:
1. tag: 1 hashtag chính, viết liền, có dấu hoặc không dấu (vd: #CaPheNgon)
2. summary: Tóm tắt bài viết cực kỳ hấp dẫn, khơi gợi tò mò (khoảng 60-160 ký tự).
3. content: TOÀN BỘ nội dung bài viết bằng HTML.

Yêu cầu BẮT BUỘC cho phần "content":
- Nội dung vừa đủ, KHÔNG ĐƯỢC VƯỢT QUÁ 4500 KÝ TỰ (khoảng 300 - 500 từ). Hãy viết súc tích, đi thẳng vào vấn đề nhưng vẫn cuốn hút.
- Bố cục rõ ràng: Mở bài hấp dẫn -> 2-3 đoạn thân bài (có tiêu đề phụ) -> Kết luận.
- Bắt buộc phải có ít nhất 2 tiêu đề phụ dùng thẻ <h2>.
- Bắt buộc phải có ít nhất 1 danh sách dùng thẻ <ul> và <li> (vd: các điểm nhấn, phân loại, lợi ích...).
- Văn phong tự nhiên, chuyên nghiệp của một blogger ẩm thực/cà phê.
- CHỈ sử dụng các thẻ HTML sau đây để trình bày (tuyệt đối không dùng <h1>, <div>, class, style, hay markdown):
<p>, <h2>, <ul>, <li>, <strong>, <em>

Viết nội dung THẬT SỰ, CHẤT LƯỢNG, TUYỆT ĐỐI KHÔNG vượt quá 5000 ký tự, không dùng các câu văn giữ chỗ.
`;

    const response = await this.generateRobust({
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia cà phê hàng đầu. BẠN BẮT BUỘC PHẢI VIẾT BÀI NGẮN GỌN (khoảng 300 - 500 TỪ), TUYỆT ĐỐI KHÔNG VƯỢT QUÁ 5000 KÝ TỰ. Hãy viết súc tích và mạch lạc.",
        maxOutputTokens: 4096,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            tag: { type: "string" },
            summary: { type: "string" },
            content: { type: "string", description: "Toàn bộ bài viết HTML định dạng bằng thẻ p, h2, ul, li, strong, em. TUYỆT ĐỐI KHÔNG VƯỢT QUÁ 5000 KÝ TỰ." },
          },
          required: ["tag", "summary", "content"],
        },
      },
    });

    return JSON.parse(response.text);
  }

  async suggestContentFromSummary(title, summary) {
    const prompt = `
Bạn là biên tập viên blog chuyên nghiệp cho một website quán cà phê.

Nhiệm vụ: Viết MỘT BÀI VIẾT HOÀN CHỈNH, RẤT CHI TIẾT dựa trên Tiêu đề và Tóm tắt sau:

Tiêu đề: "${title}"
Tóm tắt: "${summary}"

Yêu cầu BẮT BUỘC cho nội dung bài viết (content):
- ĐỘ DÀI: Bài viết súc tích, cô đọng (khoảng 300 - 500 từ). TUYỆT ĐỐI KHÔNG VƯỢT QUÁ 4500 KÝ TỰ.
- Mở bài: Dẫn dắt lôi cuốn, đi thẳng vào vấn đề.
- Thân bài: Phải có ít nhất 2 tiêu đề phụ (dùng thẻ <h2>).
- Danh sách: Có ít nhất 1 danh sách dạng bullet (dùng thẻ <ul> và <li>) để làm nổi bật các ý chính.
- Kết luận: Chốt lại vấn đề ngắn gọn.
- Văn phong: Mang tính chuyên gia, đam mê, am hiểu về cà phê.
- ĐỊNH DẠNG HOÀN TOÀN BẰNG HTML. Chỉ được phép sử dụng các thẻ sau:
<p>, <h2>, <ul>, <li>, <strong>, <em>

Hãy viết nội dung THẬT, chất lượng cao. KHÔNG viết các phần giữ chỗ kiểu "Nội dung chính rơi vào đây...".
`;

    const response = await this.generateRobust({
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia ẩm thực và cà phê chuyên nghiệp. CHÚ Ý QUAN TRỌNG: Bạn BẮT BUỘC phải viết bài SÚC TÍCH, khoảng 300 đến 500 từ. TUYỆT ĐỐI KHÔNG VƯỢT QUÁ 5000 KÝ TỰ.",
        maxOutputTokens: 4096,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Toàn bộ bài viết HTML định dạng bằng thẻ p, h2, ul, li, strong, em. TUYỆT ĐỐI KHÔNG VƯỢT QUÁ 5000 KÝ TỰ." },
          },
          required: ["content"],
        },
      },
    });

    return JSON.parse(response.text);
  }
}

module.exports = new NewsAIService();

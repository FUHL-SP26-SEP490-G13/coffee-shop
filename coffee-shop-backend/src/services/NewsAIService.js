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
Bạn là trợ lý viết bài cho mục tin tức của website quán cà phê.

Hãy dựa trên tiêu đề để tạo:
1. tag đúng định dạng #xxxxx
2. summary ngắn gọn, hấp dẫn, dài 40-120 ký tự
3. content là HTML hoàn chỉnh, dễ đọc, tự nhiên, chuyên nghiệp

Yêu cầu:
- Không trả về markdown
- content phải là HTML đơn giản như <p>, <h2>, <ul>, <li>
- tag chỉ gồm chữ cái, số hoặc dấu gạch dưới, bắt đầu bằng #
- nội dung phù hợp với bài viết dạng tin tức
- content tối thiểu 120 ký tự

Tiêu đề: "${title}"
`;

    const response = await this.generateRobust({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            tag: { type: "string" },
            summary: { type: "string" },
            content: { type: "string" },
          },
          required: ["tag", "summary", "content"],
        },
      },
    });

    return JSON.parse(response.text);
  }

  async suggestContentFromSummary(title, summary) {
    const prompt = `
Bạn là trợ lý viết bài cho mục tin tức của website quán cà phê.

Dựa trên thông tin sau:
- Tiêu đề: "${title}"
- Tóm tắt: "${summary}"

Hãy viết content HTML hoàn chỉnh.

Yêu cầu:
- Chỉ trả về JSON
- Không dùng markdown
- Nội dung là HTML với các thẻ đơn giản như <p>, <h2>, <ul>, <li>
- Văn phong tự nhiên, rõ ràng, chuyên nghiệp
- Tối thiểu 120 ký tự
`;

    const response = await this.generateRobust({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            content: { type: "string" },
          },
          required: ["content"],
        },
      },
    });

    return JSON.parse(response.text);
  }
}

module.exports = new NewsAIService();

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
Bạn là biên tập viên viết bài cho mục tin tức của website quán cà phê.

Dựa trên tiêu đề sau hãy tạo:

1. tag đúng định dạng #xxxxx
2. summary hấp dẫn 60-160 ký tự
3. content là HTML hoàn chỉnh, trình bày đẹp và dễ đọc

Yêu cầu content:
- Bắt đầu bằng đoạn mở đầu giới thiệu chủ đề
- Có ít nhất 3 tiêu đề phụ <h2>
- Có danh sách <ul><li> khi phù hợp
- Nội dung rõ ràng, tự nhiên, phù hợp blog tin tức
- HTML sạch chỉ dùng các thẻ:
<p>, <h2>, <ul>, <li>, <strong>, <em>

Cấu trúc gợi ý:

<p>Đoạn mở đầu...</p>

<h2>Phần nội dung chính</h2>
<p>...</p>

<h2>Lợi ích hoặc điểm nổi bật</h2>
<ul>
<li>...</li>
<li>...</li>
</ul>

<h2>Kết luận</h2>
<p>...</p>

Quy tắc:
- Không markdown
- Chỉ trả JSON
- Nội dung tối thiểu 200 ký tự

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
Bạn là biên tập viên blog cho website quán cà phê.

Dựa trên:

Tiêu đề: "${title}"
Tóm tắt: "${summary}"

Hãy viết bài content HTML hoàn chỉnh.

Yêu cầu:
- Có đoạn mở đầu
- Có ít nhất 3 tiêu đề <h2>
- Có danh sách <ul> khi phù hợp
- Văn phong thân thiện, tự nhiên
- Nội dung giống bài blog thực tế

HTML chỉ dùng:
<p>, <h2>, <ul>, <li>, <strong>, <em>

Cấu trúc ví dụ:

<p>Mở đầu...</p>

<h2>Thông tin chính</h2>
<p>...</p>

<h2>Điểm nổi bật</h2>
<ul>
<li>...</li>
<li>...</li>
</ul>

<h2>Kết luận</h2>
<p>...</p>

Chỉ trả JSON.
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

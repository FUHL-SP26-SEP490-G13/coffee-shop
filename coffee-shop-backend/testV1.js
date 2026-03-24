require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { apiVersion: 'v1beta' }
});

(async () => {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: "Chao ban"
    });
    console.log("SUCCESS:", res.text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
})();

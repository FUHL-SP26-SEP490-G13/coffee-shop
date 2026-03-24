require("dotenv").config();
const NewsAIService = require("./src/services/NewsAIService");

(async () => {
  try {
    const res = await NewsAIService.suggestFromTitle("Khuyến mãi Cà phê mùa hè siêu nhiệt");
    console.log("Success:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Test Error:", err.message);
  }
})();

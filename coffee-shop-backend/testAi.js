require("dotenv").config();
const AiService = require("./src/services/AiService");

(async () => {
  try {
    const res = await AiService.processChat([], "Quán có món gì?");
    console.log("Success:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Test Error:", err);
  }
})();

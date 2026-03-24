require("dotenv").config();
const NewsAIService = require('./src/services/NewsAIService.js');

(async () => {
  const title = "Cà phê chồn ngon nhất thế giới";
  const summary = "Đắm chìm vào huyền thoại về Cà phê Chồn - thức uống được mệnh danh ngon nhất thế giới. Điều gì đã biến những hạt cà phê nhỏ bé thành tuyệt tác hương vị mê hoặc mọi giác quan? Hãy cùng khám phá bí mật đằng sau ly cà phê phi thường này!";
  
  try {
    console.log("Generating content...");
    console.time("GenerationTime");
    const result = await NewsAIService.suggestContentFromSummary(title, summary);
    console.timeEnd("GenerationTime");
    
    const wordCount = result.content ? result.content.split(/\s+/).length : 0;
    console.log("\nSample of content (first 500 chars):\n", result.content?.substring(0, 500));
    // console.log("\nFull output:\n", result.content); // skip printing full HTML to console to avoid losing the word count on truncation
    console.log(`Success! Generated words: ${wordCount}`);
    console.log("Length of HTML string:", result.content?.length);
  } catch (error) {
    console.error("Error generating:", error);
  }
})();

require('dotenv').config();
const fs = require('fs');
const AiService = require('./src/services/AiService.js');

(async () => {
    try {
        const history = [
            { role: 'ai', text: 'Xin chào! Mình là trợ lý AI chờ bạn.', id: 1 }
        ];

        const result1 = await AiService.processChat(history, "xin chào", "test-session");

        history.push({ role: 'user', text: 'xin chào' });
        history.push({ role: 'ai', text: result1.text });
        
        const result2 = await AiService.processChat(history, "gợi ý cho tôi 1 ly cà phê", "test-session");

        fs.writeFileSync('output.json', JSON.stringify({ result1, result2 }, null, 2));
    } catch (e) {
        fs.writeFileSync('output.json', JSON.stringify({ error: e.message, stack: e.stack }, null, 2));
    }
})();
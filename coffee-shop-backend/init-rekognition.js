const rekognitionService = require('./src/services/RekognitionService');

(async () => {
    try {
        console.log("Đang tạo Collection trên AWS Rekognition...");
        const res = await rekognitionService.createCollection();
        console.log("Kết quả:", res);
        console.log("✅ Tạo Collection thành công! Bạn có thể xoá file này.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi khi tạo Collection:", err);
        process.exit(1);
    }
})();

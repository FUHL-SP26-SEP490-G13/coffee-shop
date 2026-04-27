const { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand, CreateCollectionCommand, DeleteFacesCommand } = require('@aws-sdk/client-rekognition');
const env = require('../config/env');

const rekognitionClient = new RekognitionClient({
  region: env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const COLLECTION_ID = env.AWS_REKOGNITION_COLLECTION || 'coffeeshop-staff';

class RekognitionService {
  /**
   * Tạo Collection (Thường chỉ chạy 1 lần lúc setup)
   */
  async createCollection() {
    try {
      const command = new CreateCollectionCommand({ CollectionId: COLLECTION_ID });
      const response = await rekognitionClient.send(command);
      return response;
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        return { message: 'Collection already exists' };
      }
      throw error;
    }
  }

  /**
   * Đăng ký khuôn mặt mới (Trả về FaceId)
   * @param {Buffer} imageBuffer 
   */
  async registerFace(imageBuffer) {
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBuffer,
      },
      MaxFaces: 1,
      QualityFilter: 'AUTO', // Tự động lọc ảnh mờ, tối
    });

    const response = await rekognitionClient.send(command);
    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      throw new Error('Không tìm thấy khuôn mặt nào trong ảnh.');
    }

    return response.FaceRecords[0].Face.FaceId;
  }

  /**
   * Tìm kiếm khuôn mặt (Trả về FaceId có độ khớp cao nhất)
   * @param {Buffer} imageBuffer 
   */
  async recognizeFace(imageBuffer) {
    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBuffer,
      },
      MaxFaces: 1,
      FaceMatchThreshold: 90, // Độ khớp >= 90%
    });

    try {
      const response = await rekognitionClient.send(command);
      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        return null;
      }
      return response.FaceMatches[0].Face.FaceId;
    } catch (error) {
      if (error.name === 'InvalidParameterException' && error.message.includes('no faces')) {
         return null; // Không có mặt trong ảnh
      }
      throw error;
    }
  }

  /**
   * Xóa khuôn mặt cũ khỏi Collection
   * @param {string} faceId
   */
  async deleteFace(faceId) {
    if (!faceId) return;
    try {
      const command = new DeleteFacesCommand({
        CollectionId: COLLECTION_ID,
        FaceIds: [faceId]
      });
      await rekognitionClient.send(command);
    } catch (error) {
      console.error('Lỗi khi xóa khuôn mặt cũ khỏi AWS Rekognition:', error);
    }
  }
}

module.exports = new RekognitionService();

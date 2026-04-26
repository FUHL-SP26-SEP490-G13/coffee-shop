const mysql = require('mysql2/promise');
const { RekognitionClient, ListFacesCommand } = require('@aws-sdk/client-rekognition');
require('dotenv').config();

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const [users] = await db.query('SELECT id, first_name, last_name, aws_face_id FROM users WHERE aws_face_id IS NOT NULL');
  console.log("Users with aws_face_id in DB:", users);

  const command = new ListFacesCommand({ CollectionId: process.env.AWS_REKOGNITION_COLLECTION });
  const response = await rekognitionClient.send(command);
  console.log("Total faces in AWS Rekognition:", response.Faces?.length);
  
  if (response.Faces) {
    const awsFaceIds = response.Faces.map(f => f.FaceId);
    const dbFaceIds = users.map(u => u.aws_face_id);
    
    const orphanedFaces = awsFaceIds.filter(id => !dbFaceIds.includes(id));
    console.log("Orphaned faces in AWS (not in DB):", orphanedFaces);
  }

  await db.end();
}

main().catch(console.error);

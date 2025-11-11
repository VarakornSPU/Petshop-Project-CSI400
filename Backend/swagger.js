// Backend/swagger.js
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ใช้สำหรับ ES Modules เพื่อหา path ปัจจุบัน ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ------------------------------------------------

const app = express();
const PORT = 4000; // ใช้พอร์ต 4000 (หรือพอร์ตอื่นที่ไม่ชนกับ 3001)

try {
  // 1. โหลดไฟล์ swagger.yaml
  const swaggerFilePath = path.resolve(__dirname, 'swagger.yaml');
  const swaggerFile = fs.readFileSync(swaggerFilePath, 'utf8');
  
  // 2. แปลง YAML เป็น JSON Object
  const swaggerDocument = yaml.load(swaggerFile);

  // 3. ตั้งค่า Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // 4. หน้าหลัก (Redirect ไป /api-docs)
  app.get('/', (req, res) => {
    res.redirect('/api-docs');
  });

  // 5. รันเซิร์ฟเวอร์
  app.listen(PORT, () => {
    console.log(`Swagger UI (Frontend) กำลังทำงานที่:`);
    console.log(`http://localhost:${PORT}/api-docs`);
    console.log(`(อย่าลืมรันเซิร์ฟเวอร์หลักที่พอร์ต 3001 ด้วยนะ!)`);
  });

} catch (e) {
  console.error('ไม่สามารถโหลด swagger.yaml ได้:', e);
}
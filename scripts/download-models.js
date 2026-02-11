import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '../public/models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const files = [
  'ssd_mobilenet_v1_model-weights_manifest.json',
  'ssd_mobilenet_v1_model-shard1',
  'ssd_mobilenet_v1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1'
];

const downloadFile = (file) => {
  const filePath = path.join(modelsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`${file} already exists`);
    return;
  }

  const fileUrl = `${baseUrl}/${file}`;
  const fileStream = fs.createWriteStream(filePath);

  console.log(`Downloading ${file}...`);
  https.get(fileUrl, (response) => {
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${file}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {}); // Delete the file async. (But we don't check the result)
    console.error(`Error downloading ${file}: ${err.message}`);
  });
};

files.forEach(downloadFile);

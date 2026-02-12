import * as faceapi from 'face-api.js';

let loadingPromise: Promise<void> | null = null;
let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        modelsLoaded = true;
      } catch (error) {
        console.error('Error loading FaceAPI models:', error);
        throw new Error(`Failed to load face recognition models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        loadingPromise = null;
      }
    })();
  }
  
  return loadingPromise;
};

export const validateFace = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  if (!modelsLoaded) {
    await loadModels();
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = async () => {
      try {
        // Use SSD MobileNet V1 for higher accuracy
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks();

        URL.revokeObjectURL(objectUrl);

        if (detections.length === 0) {
          resolve({ isValid: false, error: 'No face detected. Please upload a clear photo of your face.' });
          return;
        }

        if (detections.length > 1) {
          // Optional: Restrict to single face if needed, but for now just ensure AT LEAST one face.
          // The user said "only face image can be uploaeded", implying a selfie/portrait.
          // Multiple faces might be ambiguous. Let's warn or just accept if there's a clear face.
          // For a dating app profile, usually you want the user.
          // Let's stick to checking if there is a face.
        }

        // Check for face clarity/size (heuristic: face box should be reasonable size)
        const face = detections[0];
        const box = face.detection.box;
        const imageArea = img.width * img.height;
        const faceArea = box.width * box.height;
        
        // If face is too small relative to image (e.g. < 1% of image), might be background person
        if (faceArea / imageArea < 0.01) {
           resolve({ isValid: false, error: 'Face is too small or unclear. Please upload a close-up photo.' });
           return;
        }

        resolve({ isValid: true });
      } catch (error) {
        console.error('Face detection error:', error);
        URL.revokeObjectURL(objectUrl);
        resolve({ isValid: false, error: `Error processing image for face detection: ${error instanceof Error ? error.message : 'Unknown error'}` });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ isValid: false, error: 'Invalid image file.' });
    };
  });
};

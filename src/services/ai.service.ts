import { Platform } from 'react-native';

// 🔴 TODO: Update your Ngrok URL here
const AI_SERVER_URL = "https://subcruciform-beau-overcoy.ngrok-free.dev"; 

// 🔹 New Interface for Student Data
export interface ExtractedStudent {
  name: string;
  id: string;
}

// src/services/ai.service.ts
const uploadToAI = async (endpoint: string, file: any, params: Record<string, string>) => {
  try {
    const formData = new FormData();
    const uri = file.uri;
    
    // 🚨 FIX: Force a simple filename to avoid server parsing errors
    // We check the extension to decide if it's .pdf or .jpg
    const originalName = file.name || "file";
    const isPdf = originalName.toLowerCase().endsWith("pdf") || file.mimeType === "application/pdf";
    const cleanName = isPdf ? "upload.pdf" : "upload.jpg";
    const type = file.mimeType || (isPdf ? "application/pdf" : "image/jpeg");

    console.log(`🚀 Uploading ${originalName} as ${cleanName} (${type})...`);

    if (Platform.OS === 'web') {
      const fileRes = await fetch(uri);
      const blob = await fileRes.blob();
      formData.append('file', blob, cleanName);
    } else {
      // 📱 NATIVE UPLOAD
      formData.append('file', {
        uri: uri, // Must be a file:// URI (ensured by copyToCacheDirectory)
        name: cleanName, 
        type: type,
      } as any);
    }

    Object.keys(params).forEach((key) => {
      formData.append(key, params[key]);
    });

    const response = await fetch(`${AI_SERVER_URL}/${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: {
        // 🚨 CRITICAL: Do NOT set Content-Type header manually. 
        // fetch() sets it automatically for FormData (multipart/form-data)
        'Accept': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || `Server Error: ${response.status}`);
    }

    return result.data;

  } catch (error) {
    console.error("❌ AI Service Error:", error);
    throw error;
  }
};

// 🔹 RETURN TYPE CHANGED: Now returns Objects, not just Strings
export const extractStudentNames = async (fileAsset: any): Promise<ExtractedStudent[]> => {
  return await uploadToAI('process_exam', fileAsset, {
    'mode': 'masterlist'
  });
};

export const gradeExamPaper = async (imageUri: string, rubric: string) => {
  const fileAsset = { uri: imageUri, name: 'exam_capture.jpg', mimeType: 'image/jpeg' };
  return await uploadToAI('process_exam', fileAsset, {
    'mode': 'grade',
    'rubric': rubric
  });
};
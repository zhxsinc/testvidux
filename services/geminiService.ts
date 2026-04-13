import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedScript } from "../types";

// Helper to get client with current key
const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const checkAndRequestApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      return await window.aistudio.hasSelectedApiKey();
    }
    return true;
  }
  return true; // Fallback for environments where window.aistudio isn't injected, assuming process.env.API_KEY is present
};

/**
 * Generates a video script/storyboard based on user input using Gemini 2.5 Flash.
 */
export const generateVideoScript = async (
  productUrl: string,
  userScript: string,
  targetLanguage: string
): Promise<GeneratedScript> => {
  const ai = getClient();
  
  const prompt = `
    You are an expert video director for social media ads.
    Create a 3-scene short video script for a UGC (User Generated Content) style ad.
    
    Context:
    Product/URL: ${productUrl}
    User Idea: ${userScript}
    Target Language: ${targetLanguage}
    
    Requirements:
    1. Select a specific Avatar Persona (e.g., "Young tech enthusiast", "Professional mom") best suited for this product.
    2. Select a Voice Tone (e.g., "Energetic", "Calm", "Trustworthy").
    3. Create 3 Scenes total.
    4. Total duration approx 15-30 seconds.
    5. Provide visual descriptions and voiceover text (in ${targetLanguage}).
    6. Return strictly JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          language: { type: Type.STRING },
          suggestedAvatar: { type: Type.STRING, description: "The persona selected for the video avatar" },
          suggestedVoice: { type: Type.STRING, description: "The voice tone selected" },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                visual: { type: Type.STRING },
                audio: { type: Type.STRING },
                duration: { type: Type.INTEGER },
              },
            },
          },
        },
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as GeneratedScript;
  }
  throw new Error("Failed to generate script");
};

/**
 * Generates an image for a specific scene using Gemini 2.5 Flash Image.
 */
export const generateSceneImage = async (visualDescription: string): Promise<string> => {
  const ai = getClient();
  
  // Note: gemini-2.5-flash-image uses generateContent for images.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { 
          text: `Generate a photorealistic, vertical (9:16 aspect ratio composition) image for a social media video scene. 
                 Style: UGC (User Generated Content), authentic, handheld camera feel.
                 Visual description: ${visualDescription}` 
        },
      ],
    },
    // gemini-2.5-flash-image does not support responseMimeType or tools.
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated from the model.");
};

/**
 * Generates a video using Veo based on a prompt and an optional reference image.
 */
export const generateVideoWithVeo = async (prompt: string, imageDataUri?: string): Promise<string> => {
  // Ensure we have a fresh client (potentially with a newly selected key)
  const ai = getClient();

  try {
    let requestOptions: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16' // Portrait for UGC/Social
      }
    };

    if (imageDataUri) {
      const matches = imageDataUri.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        requestOptions.image = {
          mimeType: matches[1],
          imageBytes: matches[2]
        };
      }
    }

    let operation = await ai.models.generateVideos(requestOptions);

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
        throw new Error("No video URI returned.");
    }

    // Append API key for download if using the URI directly from Google infrastructure
    return `${videoUri}&key=${process.env.API_KEY}`;

  } catch (error: any) {
    console.error("Veo generation error:", error);
    // Handle specific key selection error if needed
    if (error.message && error.message.includes("Requested entity was not found")) {
       if(window.aistudio && window.aistudio.openSelectKey) {
           await window.aistudio.openSelectKey();
           // Retry once recursively
           return generateVideoWithVeo(prompt, imageDataUri);
       }
    }
    throw error;
  }
};
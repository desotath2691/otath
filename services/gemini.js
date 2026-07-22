import { GoogleGenAI } from "@google/genai";
import { MODELS } from "../config/models";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE,
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || "image/png";

      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("لم يتم إنشاء صورة من النموذج");
}

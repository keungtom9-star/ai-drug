// services/aiService.ts
import { Settings } from '../types';

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export const generateAIResponse = async (
  prompt: string, 
  settings: Settings,
  systemInstruction?: string
): Promise<string> => {
  const apiKey = settings.deepSeekApiKey || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DeepSeek API Key is missing. Please check your settings.");
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // or "deepseek-reasoner" for complex logic
        messages: [
          { role: "system", content: systemInstruction || "You are a helpful medical tutor." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("AI Generation Failed:", error);
    throw error;
  }
};

import { GoogleGenAI } from "@google/genai";
import { Drug, AILanguage } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCaseStudy = async (drug: Drug, language: AILanguage, onUpdate: (text: string) => void) => {
  const languagePrompt = language === 'lihkg' 
    ? "using Hong Kong 'LIHKG' style (Cantonese slang, funny, educational)" 
    : language === 'cantonese' ? "in Cantonese" : "in English";

  const prompt = `Act as a clinical nursing educator. Generate a realistic "Integrated Patient Case Study" for the drug: ${drug.name}.
    Target Audience: Nursing Student.
    Language: ${languagePrompt}.
    Structure:
    1. Patient Profile (Age, Gender, Chief Complaint).
    2. Medical History.
    3. Current Assessment Findings related to this drug.
    4. Drug Order & Rationale.
    5. 3 Nursing Priorities.
    6. "What if?" Scenario (Potential complication).
    Use Markdown formatting.`;

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of response) {
      fullText += chunk.text || "";
      onUpdate(fullText);
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const getQuizExplanation = async (quizData: any, language: AILanguage, onUpdate: (text: string) => void) => {
  const languagePrompt = language === 'lihkg' ? "LIHKG style" : language === 'cantonese' ? "Cantonese" : "English";
  
  const prompt = `Act as a pharmacology tutor. Explain the following quiz question and answer:
    Question: ${quizData.q}
    User Answer: ${quizData.u}
    Correct Drug: ${quizData.c.name}
    Correct Answer Content: ${quizData.correctAnswerText}
    
    Explain why the correct answer is right and why other options might be confusing. 
    Use ${languagePrompt}. Use Markdown.`;

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of response) {
      fullText += chunk.text || "";
      onUpdate(fullText);
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const searchGlobalDrug = async (query: string): Promise<Drug> => {
  const prompt = `You are a nursing tutor. Provide detailed clinical data for the drug "${query}" in strict JSON format.
  Use these exact keys: "name", "class", "system", "indication", "SideEffects", "nursing".
  "nursing" should be a single string with bullet points separated by newlines.
  "system" must be one of: [Gastro-intestinal system, Cardiovascular system, Respiratory system, Central nervous system, Infections, Endocrine system, Obstetrics, gynaecology, and urinary-tract disorders, Malignant disease and immunosuppression, Nutrition and blood, Musculoskeletal and joint disease, Eye, Ear, nose, and oropharynx, Skin, Immunological products and vaccines, Anaesthesia].`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    // Correctly using response.text property (not a method) as per guidelines
    const data = JSON.parse(response.text || '{}');
    return data as Drug;
  } catch (e) {
    throw new Error("Failed to parse drug data");
  }
};

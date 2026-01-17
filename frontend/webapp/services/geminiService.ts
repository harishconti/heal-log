import { GoogleGenAI } from "@google/genai";
import { Patient } from "../types";

// Initialize the client safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Gemini client:", error);
}

export const generatePatientSummary = async (patient: Patient): Promise<string> => {
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  try {
    const prompt = `
      You are an expert medical AI assistant helping a clinician.
      Analyze the following patient data and clinical notes.
      
      Patient: ${patient.name}, ${patient.age}y/o, ${patient.gender}
      Condition: ${patient.condition}
      Status: ${patient.status}
      Notes: "${patient.notes}"

      Please provide a structured response in Markdown format with:
      1. **Clinical Summary**: A concise 2-3 sentence summary of their current state.
      2. **Risk Factors**: Bullet points of potential risks based on the notes.
      3. **Recommended Actions**: 3 key next steps for the doctor.

      Keep the tone professional, concise, and medical.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate summary. Please try again.";
  }
};

export const analyzeSymptoms = async (symptoms: string): Promise<string> => {
    if (!ai) return "AI Service Unavailable: Missing API Key.";
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given these symptoms: "${symptoms}", provide a list of 3 potential differential diagnoses and what specific lab tests would help rule them in or out. Format as Markdown.`,
      });
  
      return response.text || "No analysis generated.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Failed to analyze symptoms.";
    }
  };

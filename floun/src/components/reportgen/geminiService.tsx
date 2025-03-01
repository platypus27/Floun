import axios from "axios";
import { GOOGLE_GEMINI_API_KEY } from "./key";


const API_KEY = GOOGLE_GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Function to generate AI content using Google Gemini 1.5 Flash API.
 * @param prompt The input text prompt
 * @returns AI-generated response
 */
export async function generateChatMessage(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Google Gemini API key is missing. Check your .env file.");
  }

  try {
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Extract and return the generated response content
    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return content || "No content generated.";
  } catch (error: any) {
    console.error("Error generating AI content:", error.response?.data || error.message);
    throw new Error("Failed to generate AI content");
  }
}

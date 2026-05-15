import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with environment variable
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || "");

export const identifyPill = async (base64Image: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Identify the pet medication pill in this image. 
      Return a JSON object with:
      - pillName: (string)
      - identifiedStrength: (string e.g. 5mg)
      - description: (short visual description)
      - commonUsage: (what it usually treats in pets)
      - confidence: (0-1)
      
      If you cannot identify it, set pillName to "Unknown".
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from text (sometimes Gemini wraps it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { pillName: "Unknown", confidence: 0 };
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return { pillName: "Unknown", error: "Failed to process image" };
  }
};

export const summarizeVetReport = async (base64Pdf: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze this veterinary report PDF and provide a concise clinical summary.
      Focus on:
      1. Main diagnosis or reason for visit.
      2. Any new medications prescribed (names and dosages).
      3. Key recommendations or next steps.
      4. Any concerning findings or follow-up dates.
      
      Keep the summary under 150 words and professional. 
      Format with bullet points.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Pdf,
          mimeType: "application/pdf",
        },
      },
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini PDF Error:", error);
    return "Clinical summary unavailable at this time.";
  }
};

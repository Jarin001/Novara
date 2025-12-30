const { GoogleGenAI } = require("@google/genai");
const { extractPdfText } = require("../utils/pdfUtils");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function askQuestionFromPaper(pdfUrl, question) {
  const paperText = await extractPdfText(pdfUrl);

  const prompt = `
You are an academic paper assistant.
Paper Content:
"""
${paperText}
"""
User Question:
"${question}"
Rules:
- Answer ONLY using information from the paper.
- If the paper does NOT contain enough information, reply exactly:
"Sorry, Could not find any answer for this question. Please ask anything else related to this paper."
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return (
    response.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, Could not find any answer for this question. Please ask anything from this paper."
  );
}

module.exports = { askQuestionFromPaper };





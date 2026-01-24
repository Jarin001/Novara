// const { GoogleGenAI } = require("@google/genai");
// const { extractPdfText } = require("../utils/pdfUtils");

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// async function askQuestionFromPaper(pdfUrl, question) {
//   const paperText = await extractPdfText(pdfUrl);

//   const prompt = `
// You are an academic paper assistant.
// Paper Content:
// """
// ${paperText}
// """
// User Question:
// "${question}"
// Rules:
// - Answer ONLY using information from the paper.
// - If the paper does NOT contain enough information, reply exactly:
// "Sorry, Could not find any answer for this question. Please ask anything else related to this paper."
// `;

//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: [{ role: "user", parts: [{ text: prompt }] }],
//   });

//   return (
//     response.candidates?.[0]?.content?.parts?.[0]?.text ||
//     "Sorry, Could not find any answer for this question. Please ask anything from this paper."
//   );
// }

// module.exports = { askQuestionFromPaper };



const axios = require("axios");
const { extractPdfText } = require("../utils/pdfUtils");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: "gpt-4o-mini", //"gpt-5.2",
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return (
    response.data.choices?.[0].message?.content ||
    "Sorry, Could not find any answer for this question. Please ask anything from this paper."
  );
}

module.exports = { askQuestionFromPaper };

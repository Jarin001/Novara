// services/paperAi.service.js
const { GoogleGenAI } = require("@google/genai");
const { extractPdfText } = require("../utils/pdfUtils");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function chunkText(text, chunkSize = 2000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

async function askQuestionAboutPaper(pdfUrl, question) {
  const paperText = await extractPdfText(pdfUrl);
  const chunks = chunkText(paperText);

  const relevantChunks = [];

  // 1️⃣ Relevance check
  for (const chunk of chunks) {
    const relevancePrompt = `
Paper Excerpt:
"""
${chunk}
"""

Question:
"${question}"

Does this excerpt contain information that helps answer the question?
Reply ONLY with YES or NO.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: relevancePrompt }] }],
    });

    const answer =
      response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (answer === "YES") {
      relevantChunks.push(chunk);
    }
  }

  // 2️⃣ If nothing relevant found
  if (relevantChunks.length === 0) {
    return "Sorry, this paper does not provide information relevant to your question.";
  }

  // 3️⃣ Final answer using only relevant parts
  const finalPrompt = `
You are an academic paper assistant.

Use ONLY the following excerpts from the paper:
"""
${relevantChunks.join("\n\n")}
"""

Question:
"${question}"

Rules:
- Answer ONLY using the excerpts above.
- If insufficient information exists, reply exactly:
"Sorry, this paper does not provide information relevant to your question."
`;

  const finalResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
  });

  return (
    finalResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, this paper does not provide information relevant to your question."
  );
}

module.exports = { askQuestionAboutPaper };

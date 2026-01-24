// const { GoogleGenAI } = require("@google/genai");

// const ai = new GoogleGenAI({});

// async function extractKeywords(title, abstract) {
//   if (!title && !abstract) {
//     throw new Error("Title or abstract is required for keyword extraction");
//   }

//   const prompt = `
// You are an academic research assistant.

// Paper Title:
// "${title || "N/A"}"

// Paper Abstract:
// """
// ${abstract || "N/A"}
// """

// Task:
// - Extract the most important academic keywords or key phrases.
// - Focus on concepts, methods, domains, and techniques.
// - Return ONLY a comma-separated list of keywords.
// - Do NOT add explanations or extra text.
// `;

//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: [
//       {
//         role: "user",
//         parts: [{ text: prompt }]
//       }
//     ]
//   });

//   const rawText =
//     response.candidates?.[0]?.content?.parts?.[0]?.text || "";

//   // Convert "keyword1, keyword2, keyword3" → ["keyword1", "keyword2", "keyword3"]
//   return rawText
//     .split(",")
//     .map(k => k.trim())
//     .filter(Boolean);
// }

// module.exports = { extractKeywords };


const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function extractKeywords(title, abstract) {
  if (!title && !abstract) {
    throw new Error("Title or abstract is required for keyword extraction");
  }

  const prompt = `
You are an academic research assistant.

Paper Title:
"${title || "N/A"}"

Paper Abstract:
"""
${abstract || "N/A"}
"""

Task:
- Extract the most important academic keywords or key phrases.
- Focus on concepts, methods, domains, and techniques.
- Return ONLY a comma-separated list of keywords.
- Do NOT add explanations or extra text.
`;

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: "gpt-4o-mini", // same stable model you're already using
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const rawText = response.data.choices?.[0]?.message?.content || "";

  return rawText
    .split(",")
    .map(k => k.trim())
    .filter(Boolean);
}

module.exports = { extractKeywords };

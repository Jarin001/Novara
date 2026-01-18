const axios = require("axios");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf");
const worker = require("pdfjs-dist/legacy/build/pdf.worker");

pdfjsLib.GlobalWorkerOptions.workerSrc = worker;

/**
 * Extract text from a PDF URL
 */
async function extractPdfText(pdfUrl) {
  if (!pdfUrl) throw new Error("pdfUrl is required");

  const response = await axios.get(pdfUrl, {
    responseType: "arraybuffer",
  });

  const pdfData = new Uint8Array(response.data);
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdfDocument = await loadingTask.promise;

  let text = "";

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    text += pageText + "\n";
  }

  if (!text.trim()) {
    throw new Error("No extractable text found in PDF");
  }

  return text;
}

module.exports = { extractPdfText };

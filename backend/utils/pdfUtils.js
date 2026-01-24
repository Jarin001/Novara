const axios = require("axios");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf");
const worker = require("pdfjs-dist/legacy/build/pdf.worker");

pdfjsLib.GlobalWorkerOptions.workerSrc = worker;

/**
 * Extract text from a PDF URL
 */
async function extractPdfText(pdfUrl) {
  if (!pdfUrl) throw new Error("pdfUrl is required");

  try {
    console.log("[PDF Extraction] Starting extraction from URL:", pdfUrl.substring(0, 100));

    // Add headers for arXiv and other sources
    const response = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    console.log("[PDF Extraction] Response size:", response.data.byteLength, "bytes");

    if (!response.data || response.data.byteLength === 0) {
      throw new Error("The PDF file is empty, i.e. its size is zero bytes.");
    }

    const pdfData = new Uint8Array(response.data);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDocument = await loadingTask.promise;

    console.log("[PDF Extraction] PDF loaded, pages:", pdfDocument.numPages);

    let text = "";
    let pageCount = 0;

    for (let i = 1; i <= Math.min(pdfDocument.numPages, 10); i++) { // Extract first 10 pages max
      try {
        const page = await pdfDocument.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += pageText + "\n";
        pageCount++;
      } catch (pageError) {
        console.error(`[PDF Extraction] Error extracting page ${i}:`, pageError.message);
      }
    }

    console.log("[PDF Extraction] Pages extracted:", pageCount, "Text length:", text.length);

    if (!text.trim()) {
      throw new Error("No extractable text found in PDF");
    }

    return text;
  } catch (error) {
    console.error("[PDF Extraction] Error:", error.message);
    throw error;
  }
}

module.exports = { extractPdfText };

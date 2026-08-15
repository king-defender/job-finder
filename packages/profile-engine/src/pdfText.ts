import pdfParse from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  const text = result.text.trim();
  if (!text) {
    throw new Error("PDF contains no extractable text (likely a scanned image resume).");
  }
  return text;
}

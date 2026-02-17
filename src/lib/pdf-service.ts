import type { InvoiceData } from "./invoice-html-template";

/** Options for PDF generation */
interface PdfExportOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

/** Result of a PDF export operation */
interface PdfExportResult {
  success: boolean;
  error?: string;
}

/**
 * Render the hidden invoice DOM element to a canvas via html2canvas,
 * then produce a single-page PDF whose dimensions exactly match the
 * rendered content — no page breaks, no overflow, just one long page.
 */
export async function exportInvoiceToPdf(
  _invoice: InvoiceData,
  elementId: string,
  options: PdfExportOptions = {}
): Promise<PdfExportResult> {
  const { filename = "invoice.pdf", onProgress } = options;

  onProgress?.("Rendering invoice...");

  try {
    /* Dynamically import heavy libraries so they stay out of the main bundle */
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const element = document.getElementById(elementId);
    if (!element) {
      return { success: false, error: "Invoice element not found" };
    }

    onProgress?.("Capturing content...");

    /* Render the element at 2× resolution for crisp text */
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    onProgress?.("Building PDF...");

    /*
     * Scale the canvas so the PDF width equals US-letter width (612 pt = 8.5 in).
     * Height is derived proportionally so nothing is clipped or paginated.
     */
    const pdfWidthPt = 612;
    const pdfHeightPt = (canvas.height / canvas.width) * pdfWidthPt;

    /*
     * Create a jsPDF instance using the positional constructor overload.
     * This avoids the orientation-based dimension swapping that happens
     * when using the options-object constructor with a format array.
     * The 'p' (portrait) orientation + explicit [w, h] where h >= w
     * guarantees the page is created at exactly the size we need.
     */
    const pdf = new jsPDF("p", "pt", [pdfWidthPt, pdfHeightPt]);

    /* Use JPEG encoding — much smaller data URL than PNG */
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidthPt, pdfHeightPt);

    /*
     * Safety: ensure the document has exactly one page.
     * jsPDF shouldn't add extras, but this guards against edge cases.
     */
    while (pdf.getNumberOfPages() > 1) {
      pdf.deletePage(pdf.getNumberOfPages());
    }

    pdf.save(filename);

    onProgress?.("PDF saved");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF";
    console.error("PDF generation error:", error);
    return { success: false, error: message };
  }
}

import { generateInvoiceHtml, type InvoiceData } from "./invoice-html-template";

/** Response from the PDF generation API */
interface PdfGenerationResponse {
  success: boolean;
  blob?: Blob;
  error?: string;
}

/** Options for PDF generation */
interface PdfExportOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

/**
 * Generate a PDF using the server-side rendering API.
 * Falls back to client-side generation if the server is unavailable.
 */
export async function generatePdf(
  invoice: InvoiceData,
  options: PdfExportOptions = {}
): Promise<PdfGenerationResponse> {
  const { filename = `invoice-${invoice.meta.invoiceNumber || invoice.id}.pdf`, onProgress } = options;

  onProgress?.("Generating PDF...");

  try {
    // Generate the HTML template
    const html = generateInvoiceHtml(invoice);

    // Call the server-side PDF generation API
    const response = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html, filename }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const blob = await response.blob();
    onProgress?.("PDF generated successfully");

    return { success: true, blob };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF";
    console.error("PDF generation error:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate and download a PDF for the given invoice.
 * Handles the full flow from generation to browser download.
 */
export async function downloadPdf(
  invoice: InvoiceData,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const { filename = `invoice-${invoice.meta.invoiceNumber || invoice.id}.pdf` } = options;

  const result = await generatePdf(invoice, options);

  if (!result.success || !result.blob) {
    return { success: false, error: result.error };
  }

  // Trigger browser download
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true };
}

/**
 * Client-side PDF generation fallback using html2canvas and jsPDF.
 * This is used when the server-side API is unavailable.
 */
export async function generatePdfClientSide(
  elementId: string,
  filename: string = "invoice.pdf"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamic imports to avoid bundling these in the main chunk
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const element = document.getElementById(elementId);
    if (!element) {
      return { success: false, error: "Invoice element not found" };
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const renderWidth = pageWidth;
    const renderHeight = (imgHeight * renderWidth) / imgWidth;

    let position = 0;
    let page = 0;
    while (position < renderHeight) {
      if (page > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "PNG", 0, -position, renderWidth, renderHeight);
      position += pageHeight;
      page += 1;
    }

    pdf.save(filename);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF";
    console.error("Client-side PDF generation error:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Export invoice to PDF with automatic fallback.
 * Tries server-side first, falls back to client-side if unavailable.
 */
export async function exportInvoiceToPdf(
  invoice: InvoiceData,
  fallbackElementId: string,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; error?: string; method: "server" | "client" }> {
  const filename = options.filename || `invoice-${invoice.meta.invoiceNumber || invoice.id}.pdf`;

  // Try server-side generation first
  options.onProgress?.("Generating PDF via server...");
  const serverResult = await downloadPdf(invoice, { ...options, filename });

  if (serverResult.success) {
    return { success: true, method: "server" };
  }

  // Fall back to client-side generation
  console.warn("Server-side PDF generation failed, falling back to client-side:", serverResult.error);
  options.onProgress?.("Falling back to client-side generation...");
  
  const clientResult = await generatePdfClientSide(fallbackElementId, filename);
  return { ...clientResult, method: "client" };
}

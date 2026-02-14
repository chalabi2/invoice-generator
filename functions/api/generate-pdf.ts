import puppeteer from "@cloudflare/puppeteer";

interface Env {
  BROWSER: Fetcher;
}

/**
 * Cloudflare Pages Function for generating PDFs from invoice data.
 * Uses Cloudflare Browser Rendering to render HTML and convert to PDF
 * with proper page breaks and pagination.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { html, filename = "invoice.pdf" } = body as {
      html: string;
      filename?: string;
    };

    if (!html) {
      return new Response(JSON.stringify({ error: "HTML content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Connect to Cloudflare's browser rendering service
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();

    // Set the HTML content with print-optimized styles
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Generate PDF with proper settings for invoice documents
    const pdfBuffer = await page.pdf({
      format: "letter",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      // Ensures proper page breaks
      preferCSSPageSize: true,
    });

    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

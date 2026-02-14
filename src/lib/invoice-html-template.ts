/**
 * Server-side HTML template generator for invoice PDF rendering.
 * This creates a standalone HTML document that can be rendered by Puppeteer
 * with proper print styles and page break handling.
 */

/** Invoice item structure */
export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: string;
  rate: string;
}

/** Invoice label customization */
export interface InvoiceLabels {
  logo: string;
  from: string;
  billTo: string;
  attnTo: string;
  shipTo: string;
  issueDate: string;
  paymentDate: string;
  dueDate: string;
  paymentTerms: string;
  poNumber: string;
  invoiceNumber: string;
  items: string;
  item: string;
  description: string;
  quantity: string;
  rate: string;
  notes: string;
  terms: string;
  subtotal: string;
  tax: string;
  discount: string;
  shipping: string;
  total: string;
  amountPaid: string;
  amountDue: string;
}

/** Invoice styling options */
export interface InvoiceStyle {
  font: string;
  headerColor: string;
  backgroundColor: string;
  useCustomColors: boolean;
  logoSize: "small" | "medium" | "large";
  logoPlacement: "tucked" | "prominent";
}

/** Theme options */
export type ThemeOption = "light" | "dark";

/** Template layout options */
export type TemplateOption = "modern" | "classic" | "minimal";

/** Complete invoice data structure */
export interface InvoiceData {
  id: string;
  createdAt: string;
  updatedAt: string;
  logoData: string;
  labels: InvoiceLabels;
  style: InvoiceStyle;
  preferences: {
    invoiceTheme: ThemeOption;
    useCustomTheme: boolean;
    currency: string;
    template: TemplateOption;
  };
  from: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  client: {
    name: string;
    email: string;
    address: string;
    attnTo: string;
    shipTo: string;
  };
  meta: {
    invoiceNumber: string;
    poNumber: string;
    issueDate: string;
    paymentDate: string;
    dueDate: string;
    paymentTerms: string;
  };
  items: InvoiceItem[];
  notes: string;
  terms: string;
  totals: {
    taxEnabled: boolean;
    taxValue: string;
    taxType: "percent" | "flat";
    discountEnabled: boolean;
    discountValue: string;
    discountType: "percent" | "flat";
    shippingEnabled: boolean;
    shippingValue: string;
    amountPaid: string;
  };
}

/** Color palette for invoice rendering */
interface InvoicePalette {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  headerOverlay: string;
  headerForeground: string;
}

/** Theme palettes for light and dark modes */
const THEME_PALETTES: Record<ThemeOption, { background: string; header: string }> = {
  light: { background: "#ffffff", header: "#f3f4f6" },
  dark: { background: "#1f2937", header: "#374151" },
};

/**
 * Parse a hex color string to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance for contrast calculations
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if text should be light or dark based on background
 */
function getContrastingTextColor(bgColor: string): string {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return "#000000";
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179 ? "#1f2937" : "#f9fafb";
}

/**
 * Generate a complete color palette based on background and header colors
 */
function getInvoicePalette(backgroundColor: string, headerColor: string): InvoicePalette {
  const bgRgb = hexToRgb(backgroundColor);
  const bgLuminance = bgRgb ? getLuminance(bgRgb.r, bgRgb.g, bgRgb.b) : 1;
  const isDark = bgLuminance < 0.5;

  return {
    background: backgroundColor,
    foreground: getContrastingTextColor(backgroundColor),
    muted: isDark ? "#9ca3af" : "#6b7280",
    border: isDark ? "#374151" : "#e5e7eb",
    headerOverlay: headerColor,
    headerForeground: getContrastingTextColor(headerColor),
  };
}

/**
 * Format a number as currency
 */
function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Calculate invoice totals
 */
function calculateTotals(invoice: InvoiceData): {
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  total: number;
  amountPaid: number;
  amountDue: number;
} {
  const subtotal = invoice.items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + qty * rate;
  }, 0);

  let tax = 0;
  if (invoice.totals.taxEnabled) {
    const taxVal = parseFloat(invoice.totals.taxValue) || 0;
    tax = invoice.totals.taxType === "percent" ? subtotal * (taxVal / 100) : taxVal;
  }

  let discount = 0;
  if (invoice.totals.discountEnabled) {
    const discountVal = parseFloat(invoice.totals.discountValue) || 0;
    discount = invoice.totals.discountType === "percent" ? subtotal * (discountVal / 100) : discountVal;
  }

  const shipping = invoice.totals.shippingEnabled ? parseFloat(invoice.totals.shippingValue) || 0 : 0;
  const total = subtotal + tax - discount + shipping;
  const amountPaid = parseFloat(invoice.totals.amountPaid) || 0;
  const amountDue = total - amountPaid;

  return { subtotal, tax, discount, shipping, total, amountPaid, amountDue };
}

/**
 * Get logo size class based on preference
 */
function getLogoSizeStyles(size: "small" | "medium" | "large"): string {
  switch (size) {
    case "large":
      return "height: 6.5rem;";
    case "small":
      return "height: 3.5rem;";
    default:
      return "height: 5rem;";
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Server-side fallback
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convert newlines to HTML line breaks
 */
function nl2br(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

/**
 * Generate the complete HTML document for PDF rendering.
 * This creates a standalone HTML page with embedded styles optimized for print.
 */
export function generateInvoiceHtml(invoice: InvoiceData): string {
  const themePalette = THEME_PALETTES[invoice.preferences.invoiceTheme];
  const palette = getInvoicePalette(
    invoice.style.useCustomColors ? invoice.style.backgroundColor : themePalette.background,
    invoice.style.useCustomColors ? invoice.style.headerColor : themePalette.header
  );
  const totals = calculateTotals(invoice);
  const currency = invoice.preferences.currency;
  const template = invoice.preferences.template;
  const logoSizeStyles = getLogoSizeStyles(invoice.style.logoSize);

  // Template-specific styles
  const isModern = template === "modern";
  const isClassic = template === "classic";
  const isMinimal = template === "minimal";

  const borderRadius = isModern ? "0.75rem" : "0";
  const tableBorderRadius = isModern ? "0.75rem" : "0";
  const headerBg = isMinimal ? "transparent" : palette.headerOverlay;
  const tableHeaderBg = isClassic || isMinimal ? "transparent" : palette.headerOverlay;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(invoice.meta.invoiceNumber || "Draft")}</title>
  <style>
    /* Reset and base styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    /* Print-specific styles for proper page breaks */
    @page {
      size: letter;
      margin: 0.5in;
    }
    
    @media print {
      html, body {
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Prevent page breaks inside these elements */
      .invoice-header,
      .address-section,
      .meta-section,
      .totals-section,
      .notes-section,
      .terms-section {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Allow page breaks between rows but keep rows together */
      .items-table tbody tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Ensure table headers repeat on each page */
      .items-table thead {
        display: table-header-group;
      }
      
      /* Keep totals section with last few items when possible */
      .totals-section {
        page-break-before: avoid;
        break-before: avoid;
      }
    }
    
    body {
      font-family: ${invoice.style.font}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${isClassic ? "16px" : "14px"};
      line-height: 1.5;
      color: ${palette.foreground};
      background-color: ${palette.background};
    }
    
    .invoice-container {
      max-width: 100%;
      padding: 2rem;
      background-color: ${palette.background};
      ${!isMinimal ? `border: 1px solid ${palette.border};` : ""}
      border-radius: ${borderRadius};
    }
    
    /* Header section */
    .invoice-header {
      padding: 1rem;
      margin-bottom: 1.5rem;
      background-color: ${headerBg};
      border-radius: ${borderRadius};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .invoice-header .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: ${palette.headerForeground};
      opacity: 0.8;
    }
    
    .invoice-header .number {
      font-size: 1.5rem;
      font-weight: 600;
      color: ${palette.headerForeground};
    }
    
    .logo-tucked {
      ${logoSizeStyles}
      width: auto;
      max-width: 220px;
      object-fit: contain;
    }
    
    .logo-prominent {
      ${logoSizeStyles}
      width: auto;
      max-width: 260px;
      object-fit: contain;
      margin-bottom: 0.75rem;
    }
    
    /* Address grid */
    .address-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .address-section .label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${palette.muted};
      margin-bottom: 0.5rem;
    }
    
    .address-section .name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .address-section p {
      margin-bottom: 0.25rem;
    }
    
    /* Meta section (dates, PO number, etc.) */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: ${headerBg};
      border-radius: ${borderRadius};
    }
    
    .meta-item .label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${palette.headerForeground};
      opacity: 0.7;
      margin-bottom: 0.25rem;
    }
    
    .meta-item .value {
      color: ${palette.headerForeground};
      font-weight: 500;
    }
    
    /* Items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }
    
    .items-table thead {
      background-color: ${tableHeaderBg};
    }
    
    .items-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${isClassic || isMinimal ? palette.muted : palette.headerForeground};
      ${isClassic ? `border-bottom: 1px solid ${palette.border};` : ""}
    }
    
    .items-table th:first-child {
      border-top-left-radius: ${tableBorderRadius};
    }
    
    .items-table th:last-child {
      border-top-right-radius: ${tableBorderRadius};
      text-align: right;
    }
    
    .items-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid ${palette.border};
      vertical-align: top;
    }
    
    .items-table td:last-child {
      text-align: right;
    }
    
    .item-name {
      font-weight: 500;
    }
    
    .item-description {
      font-size: 0.875rem;
      color: ${palette.muted};
      margin-top: 0.25rem;
    }
    
    .text-right {
      text-align: right;
    }
    
    /* Totals section */
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
    }
    
    .totals-section {
      min-width: 280px;
      padding: 1rem;
      ${!isMinimal ? `border: 1px solid ${palette.border};` : ""}
      border-radius: ${borderRadius};
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }
    
    .totals-row.total {
      font-weight: 700;
      font-size: 1.125rem;
      border-top: 2px solid ${palette.border};
      margin-top: 0.5rem;
      padding-top: 0.75rem;
    }
    
    .totals-row.amount-due {
      font-weight: 700;
      font-size: 1.25rem;
      color: ${palette.foreground};
    }
    
    /* Notes and terms */
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .notes-section,
    .terms-section {
      padding: 1rem;
      background-color: ${headerBg};
      border-radius: ${borderRadius};
    }
    
    .notes-section .label,
    .terms-section .label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${palette.headerForeground};
      opacity: 0.7;
      margin-bottom: 0.5rem;
    }
    
    .notes-section .content,
    .terms-section .content {
      color: ${palette.headerForeground};
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header with invoice number and optional tucked logo -->
    <div class="invoice-header">
      <div>
        <p class="label">${escapeHtml(invoice.labels.invoiceNumber)}</p>
        <p class="number">${escapeHtml(invoice.meta.invoiceNumber || "Draft")}</p>
      </div>
      ${
        invoice.logoData && invoice.style.logoPlacement === "tucked"
          ? `<img src="${invoice.logoData}" alt="Logo" class="logo-tucked">`
          : ""
      }
    </div>
    
    <!-- From/To addresses -->
    <div class="address-grid">
      <div class="address-section">
        ${
          invoice.logoData && invoice.style.logoPlacement === "prominent"
            ? `<img src="${invoice.logoData}" alt="Logo" class="logo-prominent">`
            : ""
        }
        <p class="label">${escapeHtml(invoice.labels.from)}</p>
        <p class="name">${escapeHtml(invoice.from.name)}</p>
        ${invoice.from.email ? `<p>${escapeHtml(invoice.from.email)}</p>` : ""}
        ${invoice.from.phone ? `<p>${escapeHtml(invoice.from.phone)}</p>` : ""}
        ${invoice.from.address ? `<p>${nl2br(invoice.from.address)}</p>` : ""}
      </div>
      <div class="address-section">
        <p class="label">${escapeHtml(invoice.labels.billTo)}</p>
        <p class="name">${escapeHtml(invoice.client.name)}</p>
        ${invoice.client.email ? `<p>${escapeHtml(invoice.client.email)}</p>` : ""}
        ${invoice.client.address ? `<p>${nl2br(invoice.client.address)}</p>` : ""}
        ${
          invoice.client.attnTo
            ? `<p style="margin-top: 0.5rem;"><strong>${escapeHtml(invoice.labels.attnTo)}:</strong> ${escapeHtml(invoice.client.attnTo)}</p>`
            : ""
        }
        ${
          invoice.client.shipTo
            ? `<p><strong>${escapeHtml(invoice.labels.shipTo)}:</strong> ${nl2br(invoice.client.shipTo)}</p>`
            : ""
        }
      </div>
    </div>
    
    <!-- Meta info (dates, PO, terms) -->
    <div class="meta-grid">
      ${
        invoice.meta.issueDate
          ? `
        <div class="meta-item">
          <p class="label">${escapeHtml(invoice.labels.issueDate)}</p>
          <p class="value">${escapeHtml(invoice.meta.issueDate)}</p>
        </div>
      `
          : ""
      }
      ${
        invoice.meta.dueDate
          ? `
        <div class="meta-item">
          <p class="label">${escapeHtml(invoice.labels.dueDate)}</p>
          <p class="value">${escapeHtml(invoice.meta.dueDate)}</p>
        </div>
      `
          : ""
      }
      ${
        invoice.meta.paymentTerms
          ? `
        <div class="meta-item">
          <p class="label">${escapeHtml(invoice.labels.paymentTerms)}</p>
          <p class="value">${escapeHtml(invoice.meta.paymentTerms)}</p>
        </div>
      `
          : ""
      }
      ${
        invoice.meta.poNumber
          ? `
        <div class="meta-item">
          <p class="label">${escapeHtml(invoice.labels.poNumber)}</p>
          <p class="value">${escapeHtml(invoice.meta.poNumber)}</p>
        </div>
      `
          : ""
      }
    </div>
    
    <!-- Line items table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40%">${escapeHtml(invoice.labels.item)}</th>
          <th style="width: 20%">${escapeHtml(invoice.labels.quantity)}</th>
          <th style="width: 20%">${escapeHtml(invoice.labels.rate)}</th>
          <th style="width: 20%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map((item) => {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            const amount = qty * rate;
            return `
            <tr>
              <td>
                <div class="item-name">${escapeHtml(item.name)}</div>
                ${item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ""}
              </td>
              <td>${escapeHtml(item.quantity)}</td>
              <td>${formatCurrency(rate, currency)}</td>
              <td class="text-right">${formatCurrency(amount, currency)}</td>
            </tr>
          `;
          })
          .join("")}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals-container">
      <div class="totals-section">
        <div class="totals-row">
          <span>${escapeHtml(invoice.labels.subtotal)}</span>
          <span>${formatCurrency(totals.subtotal, currency)}</span>
        </div>
        ${
          invoice.totals.taxEnabled
            ? `
          <div class="totals-row">
            <span>${escapeHtml(invoice.labels.tax)} ${invoice.totals.taxType === "percent" ? `(${invoice.totals.taxValue}%)` : ""}</span>
            <span>${formatCurrency(totals.tax, currency)}</span>
          </div>
        `
            : ""
        }
        ${
          invoice.totals.discountEnabled
            ? `
          <div class="totals-row">
            <span>${escapeHtml(invoice.labels.discount)} ${invoice.totals.discountType === "percent" ? `(${invoice.totals.discountValue}%)` : ""}</span>
            <span>-${formatCurrency(totals.discount, currency)}</span>
          </div>
        `
            : ""
        }
        ${
          invoice.totals.shippingEnabled
            ? `
          <div class="totals-row">
            <span>${escapeHtml(invoice.labels.shipping)}</span>
            <span>${formatCurrency(totals.shipping, currency)}</span>
          </div>
        `
            : ""
        }
        <div class="totals-row total">
          <span>${escapeHtml(invoice.labels.total)}</span>
          <span>${formatCurrency(totals.total, currency)}</span>
        </div>
        ${
          totals.amountPaid > 0
            ? `
          <div class="totals-row">
            <span>${escapeHtml(invoice.labels.amountPaid)}</span>
            <span>-${formatCurrency(totals.amountPaid, currency)}</span>
          </div>
          <div class="totals-row amount-due">
            <span>${escapeHtml(invoice.labels.amountDue)}</span>
            <span>${formatCurrency(totals.amountDue, currency)}</span>
          </div>
        `
            : ""
        }
      </div>
    </div>
    
    <!-- Notes and Terms -->
    ${
      invoice.notes || invoice.terms
        ? `
      <div class="footer-grid">
        ${
          invoice.notes
            ? `
          <div class="notes-section">
            <p class="label">${escapeHtml(invoice.labels.notes)}</p>
            <p class="content">${nl2br(invoice.notes)}</p>
          </div>
        `
            : ""
        }
        ${
          invoice.terms
            ? `
          <div class="terms-section">
            <p class="label">${escapeHtml(invoice.labels.terms)}</p>
            <p class="content">${nl2br(invoice.terms)}</p>
          </div>
        `
            : ""
        }
      </div>
    `
        : ""
    }
  </div>
</body>
</html>`;
}

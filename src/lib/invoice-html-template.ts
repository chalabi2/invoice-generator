/**
 * HTML template generator for invoice rendering.
 * Creates a standalone HTML document used for the invoice preview
 * and as the source element for client-side PDF capture.
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
 * Generate the complete HTML document for invoice rendering.
 * Layout: Logo + INVOICE title top, right-aligned meta, from/balance-due row,
 * bill-to, items table, right-aligned totals, then notes and terms stacked.
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

  const isModern = template === "modern";
  const isClassic = template === "classic";
  const isMinimal = template === "minimal";

  const borderRadius = isModern ? "0.75rem" : "0";
  const tableHeaderBg = isClassic || isMinimal ? "transparent" : palette.headerOverlay;
  const tableHeaderColor = isClassic || isMinimal ? palette.muted : palette.headerForeground;
  const balanceDueBg = isMinimal ? palette.border : palette.headerOverlay;
  const balanceDueColor = isMinimal ? palette.foreground : palette.headerForeground;

  /* Build the meta rows array, only including fields that have a value */
  const metaRows: Array<{ label: string; value: string }> = [];
  if (invoice.meta.issueDate?.trim()) metaRows.push({ label: invoice.labels.issueDate, value: invoice.meta.issueDate });
  if (invoice.meta.paymentTerms?.trim()) metaRows.push({ label: invoice.labels.paymentTerms, value: invoice.meta.paymentTerms });
  if (invoice.meta.dueDate?.trim()) metaRows.push({ label: invoice.labels.dueDate, value: invoice.meta.dueDate });
  if (invoice.meta.poNumber?.trim()) metaRows.push({ label: invoice.labels.poNumber, value: invoice.meta.poNumber });
  if (invoice.meta.paymentDate?.trim()) metaRows.push({ label: invoice.labels.paymentDate, value: invoice.meta.paymentDate });

  /* Collect from-contact details for the secondary line beneath the name */
  const fromDetails = [invoice.from.email, invoice.from.phone].filter(Boolean);
  
  /* Check if notes and terms have content */
  const hasNotes = invoice.notes?.trim();
  const hasTerms = invoice.terms?.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(invoice.meta.invoiceNumber || "Draft")}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ${invoice.style.font}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: ${palette.foreground};
      background-color: ${palette.background};
    }

    .invoice-container {
      max-width: 100%;
      padding: 2.5rem;
      background-color: ${palette.background};
    }

    /* ---- Top row: logo left, title right ---- */
    .invoice-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }

    .logo-image {
      ${logoSizeStyles}
      width: auto;
      max-width: 260px;
      object-fit: contain;
    }

    .title-area { text-align: right; }

    .invoice-title {
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .invoice-number {
      font-size: 0.95rem;
      color: ${palette.muted};
      margin-top: 0.125rem;
    }

    /* ---- Meta: right-aligned date/terms table ---- */
    .meta-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .meta-table { border-collapse: collapse; }

    .meta-table td { padding: 0.15rem 0; }

    .meta-label {
      text-align: right;
      padding-right: 1rem;
      color: ${palette.muted};
      font-weight: 500;
      white-space: nowrap;
    }

    .meta-value {
      text-align: right;
      font-weight: 500;
      white-space: nowrap;
    }

    /* ---- From name + Balance Due bar ---- */
    .parties-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 0.75rem;
    }

    .from-name { font-size: 1.05rem; font-weight: 600; }

    .from-details {
      font-size: 0.85rem;
      color: ${palette.muted};
      margin-top: 0.125rem;
    }

    .balance-due-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.625rem 1.25rem;
      background-color: ${balanceDueBg};
      color: ${balanceDueColor};
      border-radius: ${borderRadius};
      font-weight: 600;
    }

    .balance-due-bar .amount {
      font-size: 1.25rem;
      font-weight: 700;
    }

    /* ---- Bill To ---- */
    .bill-to-section { margin-bottom: 3rem; }

    .bill-to-section .label {
      font-size: 0.85rem;
      font-weight: 600;
      color: ${palette.muted};
      margin-bottom: 0.125rem;
    }

    .bill-to-section .client-info { font-weight: 500; }

    .client-secondary {
      font-size: 0.85rem;
      color: ${palette.muted};
      margin-top: 0.125rem;
    }

    /* ---- Items table ---- */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2.5rem;
      ${isModern ? `border-radius: ${borderRadius}; overflow: hidden;` : ""}
    }

    .items-table thead { background-color: ${tableHeaderBg}; }

    .items-table th {
      padding: 0.625rem 1rem;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 600;
      color: ${tableHeaderColor};
      ${isClassic ? `border-bottom: 2px solid ${palette.border};` : ""}
      ${isMinimal ? `border-bottom: 1px solid ${palette.border};` : ""}
    }

    .items-table th:last-child { text-align: right; }

    .items-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid ${palette.border};
      vertical-align: top;
    }

    .items-table td:last-child { text-align: right; }

    .item-name { font-weight: 500; }

    .item-description {
      font-size: 0.8rem;
      color: ${palette.muted};
      margin-top: 0.125rem;
    }

    /* ---- Totals (right-aligned) ---- */
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2rem;
    }

    .totals-table { border-collapse: collapse; min-width: 260px; }

    .totals-table td { padding: 0.3rem 0; }

    .totals-label {
      text-align: right;
      padding-right: 1.5rem;
      color: ${palette.muted};
    }

    .totals-value { text-align: right; font-weight: 500; }

    .total-row td {
      font-weight: 700;
      font-size: 1.05rem;
      border-top: 2px solid ${palette.border};
      padding-top: 0.5rem;
    }

    .amount-due-row td {
      font-weight: 700;
      font-size: 1.1rem;
    }

    /* ---- Notes & Terms (stacked) ---- */
    .notes-section, .terms-section { margin-bottom: 1rem; }

    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: ${palette.muted};
      margin-bottom: 0.25rem;
    }

    .section-content {
      white-space: pre-wrap;
      color: ${palette.foreground};
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Top: logo left, INVOICE title + number right -->
    <div class="invoice-top">
      <div>
        ${invoice.logoData ? `<img src="${invoice.logoData}" alt="Logo" class="logo-image">` : ""}
      </div>
      <div class="title-area">
        <h1 class="invoice-title">${escapeHtml(invoice.labels.invoiceNumber)}</h1>
        <p class="invoice-number"># ${escapeHtml(invoice.meta.invoiceNumber || "Draft")}</p>
      </div>
    </div>

    <!-- From name + Balance Due bar -->
    <div class="parties-row">
      <div>
        <p class="from-name">${escapeHtml(invoice.from.name)}</p>
        ${fromDetails.length > 0 ? `
        <p class="from-details">
          ${fromDetails.map(d => escapeHtml(d)).join(" &middot; ")}
        </p>` : ""}
        ${invoice.from.address?.trim() ? `
        <p class="from-details">${nl2br(invoice.from.address)}</p>` : ""}
      </div>
      <div class="balance-due-bar">
        <span>${escapeHtml(invoice.labels.amountDue)}:</span>
        <span class="amount">${formatCurrency(totals.amountDue, currency)}</span>
      </div>
    </div>

    <!-- Meta: right-aligned date, terms, due date -->
    ${metaRows.length > 0 ? `
    <div class="meta-section">
      <table class="meta-table">
        ${metaRows.map(row => `
        <tr>
          <td class="meta-label">${escapeHtml(row.label)}:</td>
          <td class="meta-value">${escapeHtml(row.value)}</td>
        </tr>`).join("")}
      </table>
    </div>` : ""}

    <!-- Bill To -->
    <div class="bill-to-section">
      <p class="label">${escapeHtml(invoice.labels.billTo)}:</p>
      <p class="client-info">
        ${escapeHtml(invoice.client.name)}${invoice.client.attnTo?.trim() ? `, ${escapeHtml(invoice.labels.attnTo)}: ${escapeHtml(invoice.client.attnTo)}` : ""}
      </p>
      ${invoice.client.email?.trim() ? `<p class="client-secondary">${escapeHtml(invoice.client.email)}</p>` : ""}
      ${invoice.client.address?.trim() ? `<p class="client-secondary">${nl2br(invoice.client.address)}</p>` : ""}
      ${invoice.client.shipTo?.trim() ? `<p class="client-secondary"><strong>${escapeHtml(invoice.labels.shipTo)}:</strong> ${nl2br(invoice.client.shipTo)}</p>` : ""}
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
        ${invoice.items.map((item) => {
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
          <td>${formatCurrency(amount, currency)}</td>
        </tr>`;
        }).join("")}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-wrapper">
      <table class="totals-table">
        <tr>
          <td class="totals-label">${escapeHtml(invoice.labels.subtotal)}:</td>
          <td class="totals-value">${formatCurrency(totals.subtotal, currency)}</td>
        </tr>
        ${invoice.totals.taxEnabled ? `
        <tr>
          <td class="totals-label">${escapeHtml(invoice.labels.tax)}${invoice.totals.taxType === "percent" ? ` (${invoice.totals.taxValue}%)` : ""}:</td>
          <td class="totals-value">${formatCurrency(totals.tax, currency)}</td>
        </tr>` : ""}
        ${invoice.totals.discountEnabled ? `
        <tr>
          <td class="totals-label">${escapeHtml(invoice.labels.discount)}${invoice.totals.discountType === "percent" ? ` (${invoice.totals.discountValue}%)` : ""}:</td>
          <td class="totals-value">-${formatCurrency(totals.discount, currency)}</td>
        </tr>` : ""}
        ${invoice.totals.shippingEnabled ? `
        <tr>
          <td class="totals-label">${escapeHtml(invoice.labels.shipping)}:</td>
          <td class="totals-value">${formatCurrency(totals.shipping, currency)}</td>
        </tr>` : ""}
        <tr class="total-row">
          <td class="totals-label">${escapeHtml(invoice.labels.total)}:</td>
          <td class="totals-value">${formatCurrency(totals.total, currency)}</td>
        </tr>
        ${totals.amountPaid > 0 ? `
        <tr>
          <td class="totals-label">${escapeHtml(invoice.labels.amountPaid)}:</td>
          <td class="totals-value">-${formatCurrency(totals.amountPaid, currency)}</td>
        </tr>
        <tr class="amount-due-row">
          <td class="totals-label">${escapeHtml(invoice.labels.amountDue)}:</td>
          <td class="totals-value">${formatCurrency(totals.amountDue, currency)}</td>
        </tr>` : ""}
      </table>
    </div>

    <!-- Notes -->
    ${hasNotes ? `
    <div class="notes-section">
      <p class="section-label">${escapeHtml(invoice.labels.notes)}:</p>
      <p class="section-content">${nl2br(invoice.notes)}</p>
    </div>` : ""}

    <!-- Terms -->
    ${hasTerms ? `
    <div class="terms-section">
      <p class="section-label">${escapeHtml(invoice.labels.terms)}:</p>
      <p class="section-content">${nl2br(invoice.terms)}</p>
    </div>` : ""}
  </div>
</body>
</html>`;
}

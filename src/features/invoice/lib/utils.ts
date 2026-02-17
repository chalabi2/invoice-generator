import type { InvoiceData, ThemeOption } from "@/features/invoice/types";

export const parseAmount = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const normalizeLogoValue = (value: string) => value.trim();

export const resolveLogoSource = (value: string) => {
  const normalized = normalizeLogoValue(value);
  if (!normalized) return "";
  if (
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../")
  ) {
    return normalized;
  }
  if (/^[\w.-]+\.[A-Za-z]{2,}(?:[/:?#]|$)/.test(normalized)) {
    return `https://${normalized}`;
  }
  return normalized;
};

export const abbreviateFileName = (name: string, maxLength = 20) => {
  if (name.length <= maxLength) return name;
  const lastDot = name.lastIndexOf(".");
  const hasExtension = lastDot > 0 && lastDot < name.length - 1;
  if (!hasExtension) {
    return `${name.slice(0, maxLength - 3)}...`;
  }

  const extension = name.slice(lastDot);
  const baseName = name.slice(0, lastDot);
  const availableBaseLength = maxLength - extension.length - 3;

  if (availableBaseLength <= 4) {
    return `${name.slice(0, maxLength - 3)}...`;
  }

  return `${baseName.slice(0, availableBaseLength)}...${extension}`;
};

export const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const validateNumber = (value: string) => {
  if (!value) return "";
  if (Number.isNaN(Number(value))) return "Enter a number";
  if (Number(value) < 0) return "Negative value";
  return "";
};

export const getTotals = (invoice: InvoiceData) => {
  const subtotal = invoice.items.reduce((sum, item) => {
    const qty = parseAmount(item.quantity);
    const rate = parseAmount(item.rate);
    return sum + qty * rate;
  }, 0);

  const taxBase =
    invoice.totals.taxType === "percent"
      ? subtotal * (parseAmount(invoice.totals.taxValue) / 100)
      : parseAmount(invoice.totals.taxValue);

  const discountBase =
    invoice.totals.discountType === "percent"
      ? subtotal * (parseAmount(invoice.totals.discountValue) / 100)
      : parseAmount(invoice.totals.discountValue);

  const tax = invoice.totals.taxEnabled ? taxBase : 0;
  const discount = invoice.totals.discountEnabled ? discountBase : 0;
  const shipping = invoice.totals.shippingEnabled
    ? parseAmount(invoice.totals.shippingValue)
    : 0;
  const total = subtotal + tax + shipping - discount;
  const amountPaid = parseAmount(invoice.totals.amountPaid);
  const amountDue = total - amountPaid;

  return { subtotal, tax, discount, shipping, total, amountPaid, amountDue };
};

export const formatTimestamp = (value: string) => {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const normalizeHex = (hex: string) => {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, "");
  if (!cleaned) {
    return "#FFFFFF";
  }
  if (cleaned.length === 3) {
    return `#${cleaned
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }
  return `#${cleaned.padEnd(6, "0").slice(0, 6)}`;
};

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex).replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const getContrastColorFromRgb = (rgb: { r: number; g: number; b: number }) => {
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
};

const getContrastColor = (hex: string) => {
  return getContrastColorFromRgb(hexToRgb(hex));
};

const rgba = (rgb: { r: number; g: number; b: number }, alpha: number) =>
  `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

const blendRgb = (
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
  alpha: number
) => ({
  r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
  g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
  b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
});

export const getInvoicePalette = (background: string, header: string) => {
  const normalizedBackground = normalizeHex(background);
  const normalizedHeader = normalizeHex(header);
  const bgRgb = hexToRgb(normalizedBackground);
  const headerRgb = hexToRgb(normalizedHeader);
  const headerAlpha = 0.25;
  const blendedHeaderRgb = blendRgb(headerRgb, bgRgb, headerAlpha);
  const foreground = getContrastColor(normalizedBackground);
  const headerForeground = getContrastColorFromRgb(blendedHeaderRgb);
  const muted =
    foreground === "#FFFFFF"
      ? "rgba(255, 255, 255, 0.72)"
      : "rgba(17, 17, 17, 0.6)";
  const border =
    foreground === "#FFFFFF"
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(17, 17, 17, 0.14)";
  const mutedBg =
    foreground === "#FFFFFF"
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(17, 17, 17, 0.05)";

  return {
    background: normalizedBackground,
    foreground,
    muted,
    border,
    mutedBg,
    header: normalizedHeader,
    headerOverlay: rgba(headerRgb, headerAlpha),
    headerForeground,
    headerShadow: rgba(headerRgb, 0.32),
    backgroundShadow: rgba(bgRgb, 0.12),
  };
};

export const getThemePalette = (theme: ThemeOption) => {
  if (theme === "dark") {
    return {
      header: "#22D3EE",
      background: "#0B1416",
    };
  }

  return {
    header: "#06B6D4",
    background: "#FFFFFF",
  };
};

import { nanoid } from "nanoid";

import type {
  InvoiceData,
  InvoiceLabels,
  StoreState,
  StoredInvoice,
  TemplateOption,
  ThemeOption,
} from "@/features/invoice/types";

export const STORAGE_KEY = "invoice-generator:v1";

export const currencyOptions = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "INR",
  "CNY",
  "MXN",
  "BRL",
];

export const fontOptions = [
  { value: "Sora, sans-serif", label: "Sora" },
  { value: "Space Grotesk, sans-serif", label: "Space Grotesk" },
  { value: "Work Sans, sans-serif", label: "Work Sans" },
  { value: "Fraunces, serif", label: "Fraunces" },
];

export const templateOptions: { value: TemplateOption; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "minimal", label: "Minimal" },
];

export const defaultLabels: InvoiceLabels = {
  logo: "Logo",
  from: "From",
  billTo: "Bill To",
  attnTo: "Attn To",
  shipTo: "Ship To",
  issueDate: "Date",
  paymentDate: "Payment Date",
  dueDate: "Due Date",
  paymentTerms: "Payment Terms",
  poNumber: "PO Number",
  invoiceNumber: "Invoice Number",
  items: "Items",
  item: "Item",
  description: "Description",
  quantity: "Qty",
  rate: "Rate",
  notes: "Notes",
  terms: "Terms",
  subtotal: "Subtotal",
  tax: "Tax",
  discount: "Discount",
  shipping: "Shipping",
  total: "Total",
  amountPaid: "Amount Paid",
  amountDue: "Amount Due",
};

export const getDefaultUiTheme = (): ThemeOption => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const createEmptyInvoice = (): InvoiceData => {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    logoData: "",
    labels: { ...defaultLabels },
    style: {
      font: fontOptions[0].value,
      headerColor: "#06B6D4",
      backgroundColor: "#FFFFFF",
      useCustomColors: false,
      logoSize: "medium",
    },
    preferences: {
      invoiceTheme: "light",
      useCustomTheme: false,
      currency: "USD",
      template: "modern",
    },
    from: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    client: {
      name: "",
      email: "",
      address: "",
      attnTo: "",
      shipTo: "",
    },
    meta: {
      invoiceNumber: "",
      poNumber: "",
      issueDate: "",
      paymentDate: "",
      dueDate: "",
      paymentTerms: "",
    },
    items: [
      {
        id: nanoid(),
        name: "",
        description: "",
        quantity: "1",
        rate: "",
      },
    ],
    notes: "",
    terms: "",
    totals: {
      taxEnabled: false,
      taxValue: "0",
      taxType: "percent",
      discountEnabled: false,
      discountValue: "0",
      discountType: "percent",
      shippingEnabled: false,
      shippingValue: "0",
      amountPaid: "0",
    },
  };
};

export const createInitialStore = (): StoreState => {
  const invoice = createEmptyInvoice();
  const stored: StoredInvoice = {
    id: invoice.id,
    clientName: invoice.client.name,
    invoiceNumber: invoice.meta.invoiceNumber,
    updatedAt: invoice.updatedAt,
    folderId: null,
    data: invoice,
  };
  return {
    invoices: [stored],
    folders: [],
    activeInvoiceId: stored.id,
    settings: {
      uiTheme: getDefaultUiTheme(),
    },
  };
};

export type ThemeOption = "light" | "dark";
export type TemplateOption = "modern" | "classic" | "minimal";

export type InvoiceItem = {
  id: string;
  name: string;
  description: string;
  quantity: string;
  rate: string;
};

export type InvoiceLabels = {
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
};

export type InvoiceStyle = {
  font: string;
  headerColor: string;
  backgroundColor: string;
  useCustomColors: boolean;
  logoSize: "small" | "medium" | "large";
};

export type InvoiceData = {
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
};

export type StoredInvoice = {
  id: string;
  clientName: string;
  invoiceNumber: string;
  updatedAt: string;
  folderId: string | null;
  data: InvoiceData;
};

export type InvoiceFolder = {
  id: string;
  name: string;
  createdAt: string;
};

export type StoreState = {
  invoices: StoredInvoice[];
  folders: InvoiceFolder[];
  activeInvoiceId: string | null;
  settings: {
    uiTheme: ThemeOption;
  };
};

export interface ExportState {
  isExporting: boolean;
  status: string;
  error: string | null;
}

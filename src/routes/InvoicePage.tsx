import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Link2Off, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { cn } from "@/lib/utils";

type ThemeOption = "light" | "dark";
type TemplateOption = "modern" | "classic" | "minimal";

type InvoiceItem = {
  id: string;
  name: string;
  description: string;
  quantity: string;
  rate: string;
};

type InvoiceLabels = {
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

type InvoiceStyle = {
  font: string;
  headerColor: string;
  backgroundColor: string;
  useCustomColors: boolean;
};

type InvoiceData = {
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

type StoredInvoice = {
  id: string;
  clientName: string;
  invoiceNumber: string;
  updatedAt: string;
  data: InvoiceData;
};

type StoreState = {
  invoices: StoredInvoice[];
  activeInvoiceId: string | null;
  settings: {
    uiTheme: ThemeOption;
  };
};

const STORAGE_KEY = "invoice-generator:v1";

const currencyOptions = [
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

const fontOptions = [
  { value: "Sora, sans-serif", label: "Sora" },
  { value: "Space Grotesk, sans-serif", label: "Space Grotesk" },
  { value: "Work Sans, sans-serif", label: "Work Sans" },
  { value: "Fraunces, serif", label: "Fraunces" },
];

const templateOptions: { value: TemplateOption; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "minimal", label: "Minimal" },
];

const defaultLabels: InvoiceLabels = {
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

const createEmptyInvoice = (): InvoiceData => {
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

const createInitialStore = (): StoreState => {
  const invoice = createEmptyInvoice();
  const stored: StoredInvoice = {
    id: invoice.id,
    clientName: invoice.client.name,
    invoiceNumber: invoice.meta.invoiceNumber,
    updatedAt: invoice.updatedAt,
    data: invoice,
  };
  return {
    invoices: [stored],
    activeInvoiceId: stored.id,
    settings: {
      uiTheme: "light",
    },
  };
};

const parseAmount = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const validateNumber = (value: string) => {
  if (!value) return "";
  if (Number.isNaN(Number(value))) return "Enter a number";
  if (Number(value) < 0) return "Negative value";
  return "";
};

const getTotals = (invoice: InvoiceData) => {
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

const formatTimestamp = (value: string) => {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const normalizeHex = (hex: string) => {
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

const getContrastColor = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
};

const rgba = (rgb: { r: number; g: number; b: number }, alpha: number) =>
  `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

const getInvoicePalette = (background: string, header: string) => {
  const bgRgb = hexToRgb(background);
  const headerRgb = hexToRgb(header);
  const foreground = getContrastColor(background);
  const headerForeground = getContrastColor(header);
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
    background: normalizeHex(background),
    foreground,
    muted,
    border,
    mutedBg,
    header: normalizeHex(header),
    headerForeground,
    headerShadow: rgba(headerRgb, 0.32),
    backgroundShadow: rgba(bgRgb, 0.12),
  };
};

const getThemePalette = (theme: ThemeOption) => {
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

const EditableLabel = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        className={cn("h-7 text-xs", className)}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
        className
      )}
    >
      {value}
    </button>
  );
};

const Field = ({
  label,
  onLabelChange,
  children,
  hint,
}: {
  label: string;
  onLabelChange: (value: string) => void;
  children: React.ReactNode;
  hint?: string;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <EditableLabel value={label} onChange={onLabelChange} />
        {hint ? (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
};

const ColorField = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-[hsl(var(--muted-foreground))]">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={cn(
            "h-9 w-12 cursor-pointer rounded-md border border-[hsl(var(--border))] bg-transparent p-1",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

const useInvoiceStore = () => {
  const [store, setStore] = useLocalStorageState<StoreState>(
    STORAGE_KEY,
    createInitialStore()
  );

  const activeInvoice = React.useMemo(() => {
    const found = store.invoices.find(
      (invoice) => invoice.id === store.activeInvoiceId
    );
    const base = found?.data ?? createEmptyInvoice();
    const mergedStyle = {
      ...base.style,
      font: base.style?.font ?? fontOptions[0].value,
      headerColor: base.style?.headerColor ?? "#06B6D4",
      backgroundColor: base.style?.backgroundColor ?? "#FFFFFF",
      useCustomColors: base.style?.useCustomColors ?? false,
    };

    const mergedPreferences = {
      ...base.preferences,
      invoiceTheme: base.preferences?.invoiceTheme ?? ("light" as ThemeOption),
      useCustomTheme: base.preferences?.useCustomTheme ?? false,
      currency: base.preferences?.currency ?? "USD",
      template: base.preferences?.template ?? ("modern" as TemplateOption),
    };

    const headerLower = mergedStyle.headerColor.toLowerCase();
    if (!mergedStyle.useCustomColors) {
      mergedStyle.headerColor = "#06B6D4";
      mergedStyle.backgroundColor = "#FFFFFF";
    } else if (headerLower === "#e24b2a" || headerLower === "#f97316") {
      mergedStyle.headerColor = "#06B6D4";
    }

    return {
      ...base,
      labels: { ...defaultLabels, ...base.labels },
      style: mergedStyle,
      preferences: mergedPreferences,
    };
  }, [store.activeInvoiceId, store.invoices]);

  const resolvedTheme: ThemeOption =
    store.settings.uiTheme === "dark" ? "dark" : "light";
  const invoiceTheme = activeInvoice.preferences.useCustomTheme
    ? activeInvoice.preferences.invoiceTheme
    : resolvedTheme;

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${resolvedTheme}`);
  }, [resolvedTheme]);

  React.useEffect(() => {
    if (!store.settings.uiTheme) {
      setStore((current) => ({
        ...current,
        settings: { ...current.settings, uiTheme: "light" },
      }));
    }
  }, [store.settings.uiTheme, setStore]);

  const updateInvoice = (updater: (data: InvoiceData) => InvoiceData) => {
    setStore((current) => {
      const invoices = current.invoices.map((invoice) => {
        if (invoice.id !== current.activeInvoiceId) return invoice;
        const updated = updater(invoice.data);
        const timestamp = new Date().toISOString();
        return {
          ...invoice,
          clientName: updated.client.name,
          invoiceNumber: updated.meta.invoiceNumber,
          updatedAt: timestamp,
          data: { ...updated, updatedAt: timestamp },
        };
      });
      return { ...current, invoices };
    });
  };

  const setActiveInvoice = (id: string) => {
    setStore((current) => ({ ...current, activeInvoiceId: id }));
  };

  const addInvoice = () => {
    const fresh = createEmptyInvoice();
    const stored: StoredInvoice = {
      id: fresh.id,
      clientName: fresh.client.name,
      invoiceNumber: fresh.meta.invoiceNumber,
      updatedAt: fresh.updatedAt,
      data: fresh,
    };
    setStore((current) => ({
      ...current,
      invoices: [stored, ...current.invoices],
      activeInvoiceId: stored.id,
    }));
  };

  const deleteInvoice = (id?: string) => {
    setStore((current) => {
      const targetId = id ?? current.activeInvoiceId;
      if (!targetId) return current;
      const remaining = current.invoices.filter(
        (invoice) => invoice.id !== targetId
      );
      if (!remaining.length) {
        const fallback = createInitialStore();
        return {
          ...current,
          invoices: fallback.invoices,
          activeInvoiceId: fallback.activeInvoiceId,
        };
      }
      return {
        ...current,
        invoices: remaining,
        activeInvoiceId: remaining[0].id,
      };
    });
  };

  return {
    store,
    setStore,
    activeInvoice,
    invoiceTheme,
    updateInvoice,
    setActiveInvoice,
    addInvoice,
    deleteInvoice,
  };
};

const exportToPdf = async (
  invoiceId: string | undefined,
  setActive: ((id: string) => void) | undefined,
  targetId: string
) => {
  if (invoiceId && setActive) {
    setActive(invoiceId);
  }

  window.setTimeout(async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imageData = canvas.toDataURL("image/png");
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
      pdf.addImage(imageData, "PNG", 0, -position, renderWidth, renderHeight);
      position += pageHeight;
      page += 1;
    }

    pdf.save("invoice.pdf");
  }, 120);
};

const InvoiceShell = ({
  children,
  store,
  setStore,
  onExport,
  exportTargetId,
  exportPreview,
  activeInvoice,
}: {
  children: React.ReactNode;
  store: StoreState;
  setStore: React.Dispatch<React.SetStateAction<StoreState>>;
  onExport: () => void;
  exportTargetId: string;
  exportPreview: React.ReactNode;
  activeInvoice: InvoiceData;
}) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isEdit = pathname.startsWith("/edit");
  const isLibrary = pathname === "/" || pathname.startsWith("/library");
  const isPreviewPage = pathname.startsWith("/preview");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--accent))_0%,_transparent_55%)] pb-20">
      <header className="no-print sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 backdrop-blur">
        <TooltipProvider>
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                <img
                  src={
                    store.settings.uiTheme === "dark"
                      ? "/document-icon-light.svg"
                      : "/document-icon-dark.svg"
                  }
                  alt="Document"
                  className="h-5 w-5"
                />
              </div>
              <div>
                <p className="text-lg font-semibold">invoicegenerator.xyz</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Free, open invoice generator
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavigationMenuLink
                          asChild
                          className={cn(
                            navigationMenuTriggerStyle,
                            isLibrary && "bg-[hsl(var(--muted))]"
                          )}
                        >
                          <Link to="/library">Library</Link>
                        </NavigationMenuLink>
                      </TooltipTrigger>
                      <TooltipContent>Browse saved invoices</TooltipContent>
                    </Tooltip>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavigationMenuLink
                          asChild
                          className={cn(
                            navigationMenuTriggerStyle,
                            isEdit && "bg-[hsl(var(--muted))]"
                          )}
                        >
                          <Link to="/edit">Edit</Link>
                        </NavigationMenuLink>
                      </TooltipTrigger>
                      <TooltipContent>Edit the active invoice</TooltipContent>
                    </Tooltip>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavigationMenuLink
                          asChild
                          className={cn(
                            navigationMenuTriggerStyle,
                            isPreviewPage && "bg-[hsl(var(--muted))]"
                          )}
                        >
                          <Link to="/preview">Preview</Link>
                        </NavigationMenuLink>
                      </TooltipTrigger>
                      <TooltipContent>Preview the final invoice</TooltipContent>
                    </Tooltip>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="sm" onClick={onExport}>
                    Export PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print or save as PDF</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setStore((current) => ({
                        ...current,
                        settings: {
                          ...current.settings,
                          uiTheme:
                            current.settings.uiTheme === "dark"
                              ? "light"
                              : "dark",
                        },
                      }))
                    }
                    aria-label="Toggle UI theme"
                  >
                    {store.settings.uiTheme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    {activeInvoice.preferences.useCustomTheme ? (
                      <Link2Off className="ml-2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                    ) : null}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle app theme</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-10">
        {children}
      </div>
      <div
        className="pointer-events-none fixed left-[-10000px] top-0"
        aria-hidden="true"
      >
        <div id={exportTargetId} className="w-[816px]">
          {exportPreview}
        </div>
      </div>
    </div>
  );
};

export function InvoiceEditorPage() {
  const {
    store,
    setStore,
    activeInvoice,
    invoiceTheme,
    updateInvoice,
    setActiveInvoice,
  } = useInvoiceStore();

  const totals = React.useMemo(() => getTotals(activeInvoice), [activeInvoice]);

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateInvoice((data) => ({
        ...data,
        logoData: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const updateLabel = (key: keyof InvoiceLabels, value: string) => {
    updateInvoice((data) => ({
      ...data,
      labels: { ...data.labels, [key]: value || defaultLabels[key] },
    }));
  };

  const onExport = () =>
    exportToPdf(
      store.activeInvoiceId ?? undefined,
      setActiveInvoice,
      "invoice-export"
    );

  return (
    <InvoiceShell
      store={store}
      setStore={setStore}
      onExport={onExport}
      exportTargetId="invoice-export"
      exportPreview={
        <InvoicePreview
          invoice={activeInvoice}
          currency={activeInvoice.preferences.currency}
          template={activeInvoice.preferences.template}
          theme={invoiceTheme}
          exportMode
        />
      }
      activeInvoice={activeInvoice}
    >
      <div className="space-y-6">
        <div className="print-only" />
        <div className="no-print">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="flex w-full justify-start">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="totals">Totals</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="styles">Styles</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand & Client</CardTitle>
                  <CardDescription>
                    Click any label to rename it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <Field
                        label={activeInvoice.labels.logo}
                        onLabelChange={(value) => updateLabel("logo", value)}
                        hint="Optional"
                      >
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <Input
                            placeholder="Paste logo URL"
                            value={
                              activeInvoice.logoData.startsWith("data:")
                                ? ""
                                : activeInvoice.logoData
                            }
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                logoData: event.target.value,
                              }))
                            }
                          />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              handleLogoUpload(event.target.files?.[0] ?? null)
                            }
                          />
                        </div>
                      </Field>
                      <Field
                        label={activeInvoice.labels.from}
                        onLabelChange={(value) => updateLabel("from", value)}
                      >
                        <div className="space-y-3">
                          <Input
                            placeholder="Business name"
                            value={activeInvoice.from.name}
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                from: {
                                  ...data.from,
                                  name: event.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            placeholder="Email"
                            value={activeInvoice.from.email}
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                from: {
                                  ...data.from,
                                  email: event.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            placeholder="Phone"
                            value={activeInvoice.from.phone}
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                from: {
                                  ...data.from,
                                  phone: event.target.value,
                                },
                              }))
                            }
                          />
                          <Textarea
                            placeholder="Address"
                            value={activeInvoice.from.address}
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                from: {
                                  ...data.from,
                                  address: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </Field>
                    </div>
                    <div className="space-y-4">
                      <Field
                        label={activeInvoice.labels.billTo}
                        onLabelChange={(value) => updateLabel("billTo", value)}
                      >
                        <div className="space-y-3">
                          <Input
                            placeholder="Client name"
                            value={activeInvoice.client.name}
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                client: {
                                  ...data.client,
                                  name: event.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            placeholder="Client email"
                            value={activeInvoice.client.email}
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                client: {
                                  ...data.client,
                                  email: event.target.value,
                                },
                              }))
                            }
                          />
                          <Textarea
                            placeholder="Client address"
                            value={activeInvoice.client.address}
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                client: {
                                  ...data.client,
                                  address: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </Field>
                      <Field
                        label={activeInvoice.labels.attnTo}
                        onLabelChange={(value) => updateLabel("attnTo", value)}
                      >
                        <Input
                          placeholder="Contact person"
                          value={activeInvoice.client.attnTo}
                          onChange={(event) =>
                            updateInvoice((data) => ({
                              ...data,
                              client: {
                                ...data.client,
                                attnTo: event.target.value,
                              },
                            }))
                          }
                        />
                      </Field>
                      <Field
                        label={activeInvoice.labels.shipTo}
                        onLabelChange={(value) => updateLabel("shipTo", value)}
                      >
                        <Input
                          placeholder="Shipping destination"
                          value={activeInvoice.client.shipTo}
                          onChange={(event) =>
                            updateInvoice((data) => ({
                              ...data,
                              client: {
                                ...data.client,
                                shipTo: event.target.value,
                              },
                            }))
                          }
                        />
                      </Field>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoice Meta</CardTitle>
                  <CardDescription>
                    Dates, terms, and reference numbers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={activeInvoice.labels.invoiceNumber}
                    onLabelChange={(value) =>
                      updateLabel("invoiceNumber", value)
                    }
                  >
                    <Input
                      value={activeInvoice.meta.invoiceNumber}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: {
                            ...data.meta,
                            invoiceNumber: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.poNumber}
                    onLabelChange={(value) => updateLabel("poNumber", value)}
                  >
                    <Input
                      value={activeInvoice.meta.poNumber}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: { ...data.meta, poNumber: event.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.issueDate}
                    onLabelChange={(value) => updateLabel("issueDate", value)}
                  >
                    <Input
                      type="date"
                      value={activeInvoice.meta.issueDate}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: { ...data.meta, issueDate: event.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.paymentDate}
                    onLabelChange={(value) => updateLabel("paymentDate", value)}
                  >
                    <Input
                      type="date"
                      value={activeInvoice.meta.paymentDate}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: {
                            ...data.meta,
                            paymentDate: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.dueDate}
                    onLabelChange={(value) => updateLabel("dueDate", value)}
                  >
                    <Input
                      type="date"
                      value={activeInvoice.meta.dueDate}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: { ...data.meta, dueDate: event.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.paymentTerms}
                    onLabelChange={(value) =>
                      updateLabel("paymentTerms", value)
                    }
                  >
                    <Input
                      value={activeInvoice.meta.paymentTerms}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: {
                            ...data.meta,
                            paymentTerms: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{activeInvoice.labels.items}</CardTitle>
                  <CardDescription>Add and edit line items.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {activeInvoice.items.map((item, index) => {
                      const qtyError = validateNumber(item.quantity);
                      const rateError = validateNumber(item.rate);
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-[hsl(var(--border))] p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold">
                              Item {index + 1}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateInvoice((data) => ({
                                  ...data,
                                  items: data.items.filter(
                                    (entry) => entry.id !== item.id
                                  ),
                                }))
                              }
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <EditableLabel
                                value={activeInvoice.labels.item}
                                onChange={(value) => updateLabel("item", value)}
                              />
                              <Input
                                placeholder="Service or product"
                                value={item.name}
                                onChange={(event) =>
                                  updateInvoice((data) => ({
                                    ...data,
                                    items: data.items.map((entry) =>
                                      entry.id === item.id
                                        ? { ...entry, name: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <EditableLabel
                                value={activeInvoice.labels.description}
                                onChange={(value) =>
                                  updateLabel("description", value)
                                }
                              />
                              <Input
                                placeholder="Optional detail"
                                value={item.description}
                                onChange={(event) =>
                                  updateInvoice((data) => ({
                                    ...data,
                                    items: data.items.map((entry) =>
                                      entry.id === item.id
                                        ? {
                                            ...entry,
                                            description: event.target.value,
                                          }
                                        : entry
                                    ),
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <EditableLabel
                                value={activeInvoice.labels.quantity}
                                onChange={(value) =>
                                  updateLabel("quantity", value)
                                }
                              />
                              <Input
                                value={item.quantity}
                                onChange={(event) =>
                                  updateInvoice((data) => ({
                                    ...data,
                                    items: data.items.map((entry) =>
                                      entry.id === item.id
                                        ? {
                                            ...entry,
                                            quantity: event.target.value,
                                          }
                                        : entry
                                    ),
                                  }))
                                }
                              />
                              {qtyError ? (
                                <p className="text-xs text-[hsl(var(--destructive))]">
                                  {qtyError}
                                </p>
                              ) : null}
                            </div>
                            <div className="space-y-2">
                              <EditableLabel
                                value={activeInvoice.labels.rate}
                                onChange={(value) => updateLabel("rate", value)}
                              />
                              <Input
                                value={item.rate}
                                onChange={(event) =>
                                  updateInvoice((data) => ({
                                    ...data,
                                    items: data.items.map((entry) =>
                                      entry.id === item.id
                                        ? { ...entry, rate: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                              />
                              {rateError ? (
                                <p className="text-xs text-[hsl(var(--destructive))]">
                                  {rateError}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateInvoice((data) => ({
                        ...data,
                        items: [
                          ...data.items,
                          {
                            id: nanoid(),
                            name: "",
                            description: "",
                            quantity: "1",
                            rate: "",
                          },
                        ],
                      }))
                    }
                  >
                    Add line item
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="totals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Totals & Payments</CardTitle>
                  <CardDescription>Optional fees and balances.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                        Currency
                      </Label>
                      <Select
                        value={activeInvoice.preferences.currency}
                        onValueChange={(value) =>
                          updateInvoice((data) => ({
                            ...data,
                            preferences: {
                              ...data.preferences,
                              currency: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyOptions.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-4">
                      <div className="flex items-center justify-between">
                        <EditableLabel
                          value={activeInvoice.labels.tax}
                          onChange={(value) => updateLabel("tax", value)}
                        />
                        <Switch
                          checked={activeInvoice.totals.taxEnabled}
                          onCheckedChange={(checked) =>
                            updateInvoice((data) => ({
                              ...data,
                              totals: { ...data.totals, taxEnabled: checked },
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                        <Input
                          value={activeInvoice.totals.taxValue}
                          onChange={(event) =>
                            updateInvoice((data) => ({
                              ...data,
                              totals: {
                                ...data.totals,
                                taxValue: event.target.value,
                              },
                            }))
                          }
                        />
                        <Select
                          value={activeInvoice.totals.taxType}
                          onValueChange={(value) =>
                            updateInvoice((data) => ({
                              ...data,
                              totals: {
                                ...data.totals,
                                taxType: value as "percent" | "flat",
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {validateNumber(activeInvoice.totals.taxValue) ? (
                        <p className="text-xs text-[hsl(var(--destructive))]">
                          {validateNumber(activeInvoice.totals.taxValue)}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-4">
                      <div className="flex items-center justify-between">
                        <EditableLabel
                          value={activeInvoice.labels.discount}
                          onChange={(value) => updateLabel("discount", value)}
                        />
                        <Switch
                          checked={activeInvoice.totals.discountEnabled}
                          onCheckedChange={(checked) =>
                            updateInvoice((data) => ({
                              ...data,
                              totals: {
                                ...data.totals,
                                discountEnabled: checked,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                        <Input
                          value={activeInvoice.totals.discountValue}
                          onChange={(event) =>
                            updateInvoice((data) => ({
                              ...data,
                              totals: {
                                ...data.totals,
                                discountValue: event.target.value,
                              },
                            }))
                          }
                        />
                        <Select
                          value={activeInvoice.totals.discountType}
                          onValueChange={(value) =>
                            updateInvoice((data) => ({
                              ...data,
                              totals: {
                                ...data.totals,
                                discountType: value as "percent" | "flat",
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {validateNumber(activeInvoice.totals.discountValue) ? (
                        <p className="text-xs text-[hsl(var(--destructive))]">
                          {validateNumber(activeInvoice.totals.discountValue)}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-4">
                      <div className="flex items-center justify-between">
                        <EditableLabel
                          value={activeInvoice.labels.shipping}
                          onChange={(value) => updateLabel("shipping", value)}
                        />
                        <Switch
                          checked={activeInvoice.totals.shippingEnabled}
                          onCheckedChange={(checked) =>
                            updateInvoice((data) => ({
                              ...data,
                              totals: {
                                ...data.totals,
                                shippingEnabled: checked,
                              },
                            }))
                          }
                        />
                      </div>
                      <Input
                        value={activeInvoice.totals.shippingValue}
                        onChange={(event) =>
                          updateInvoice((data) => ({
                            ...data,
                            totals: {
                              ...data.totals,
                              shippingValue: event.target.value,
                            },
                          }))
                        }
                      />
                      {validateNumber(activeInvoice.totals.shippingValue) ? (
                        <p className="text-xs text-[hsl(var(--destructive))]">
                          {validateNumber(activeInvoice.totals.shippingValue)}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-4">
                      <EditableLabel
                        value={activeInvoice.labels.amountPaid}
                        onChange={(value) => updateLabel("amountPaid", value)}
                      />
                      <Input
                        value={activeInvoice.totals.amountPaid}
                        onChange={(event) =>
                          updateInvoice((data) => ({
                            ...data,
                            totals: {
                              ...data.totals,
                              amountPaid: event.target.value,
                            },
                          }))
                        }
                      />
                      {validateNumber(activeInvoice.totals.amountPaid) ? (
                        <p className="text-xs text-[hsl(var(--destructive))]">
                          {validateNumber(activeInvoice.totals.amountPaid)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-[hsl(var(--border))] p-4">
                      <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                        {activeInvoice.labels.subtotal}
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatCurrency(
                          totals.subtotal,
                          activeInvoice.preferences.currency
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[hsl(var(--border))] p-4">
                      <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                        {activeInvoice.labels.total}
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatCurrency(
                          totals.total,
                          activeInvoice.preferences.currency
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[hsl(var(--border))] p-4">
                      <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                        {activeInvoice.labels.amountPaid}
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(
                          totals.amountPaid,
                          activeInvoice.preferences.currency
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[hsl(var(--border))] p-4">
                      <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                        {activeInvoice.labels.amountDue}
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(
                          totals.amountDue,
                          activeInvoice.preferences.currency
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notes & Terms</CardTitle>
                  <CardDescription>
                    Include any extra instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field
                    label={activeInvoice.labels.notes}
                    onLabelChange={(value) => updateLabel("notes", value)}
                  >
                    <Textarea
                      value={activeInvoice.notes}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.terms}
                    onLabelChange={(value) => updateLabel("terms", value)}
                  >
                    <Textarea
                      value={activeInvoice.terms}
                      onChange={(event) =>
                        updateInvoice((data) => ({
                          ...data,
                          terms: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="styles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Styling</CardTitle>
                  <CardDescription>
                    Customize the invoice look and feel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                        Invoice theme
                      </Label>
                      {activeInvoice.preferences.useCustomTheme ? (
                        <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                          <Link2Off className="h-3.5 w-3.5" />
                          Custom
                        </span>
                      ) : null}
                    </div>
                    <Select
                      value={activeInvoice.preferences.invoiceTheme}
                      onValueChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          preferences: {
                            ...data.preferences,
                            invoiceTheme: value as ThemeOption,
                          },
                        }))
                      }
                      disabled={!activeInvoice.preferences.useCustomTheme}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                      Custom invoice theme
                    </Label>
                    <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2">
                      <span className="text-sm">Override UI theme</span>
                      <Switch
                        checked={activeInvoice.preferences.useCustomTheme}
                        onCheckedChange={(checked) =>
                          updateInvoice((data) => ({
                            ...data,
                            preferences: {
                              ...data.preferences,
                              useCustomTheme: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                      Font
                    </Label>
                    <Select
                      value={activeInvoice.style.font}
                      onValueChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          style: { ...data.style, font: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                      Use custom colors
                    </Label>
                    <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2">
                      <span className="text-sm">Override theme colors</span>
                      <Switch
                        checked={activeInvoice.style.useCustomColors}
                        onCheckedChange={(checked) =>
                          updateInvoice((data) => ({
                            ...data,
                            style: { ...data.style, useCustomColors: checked },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <ColorField
                    label="Header color"
                    value={activeInvoice.style.headerColor}
                    onChange={(value) =>
                      updateInvoice((data) => ({
                        ...data,
                        style: { ...data.style, headerColor: value },
                      }))
                    }
                    disabled={!activeInvoice.style.useCustomColors}
                  />
                  <ColorField
                    label="Background color"
                    value={activeInvoice.style.backgroundColor}
                    onChange={(value) =>
                      updateInvoice((data) => ({
                        ...data,
                        style: { ...data.style, backgroundColor: value },
                      }))
                    }
                    disabled={!activeInvoice.style.useCustomColors}
                  />
                  <div className="space-y-2">
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                      Template
                    </Label>
                    <Select
                      value={activeInvoice.preferences.template}
                      onValueChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          preferences: {
                            ...data.preferences,
                            template: value as TemplateOption,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOptions.map((template) => (
                          <SelectItem
                            key={template.value}
                            value={template.value}
                          >
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </InvoiceShell>
  );
}

export function InvoicePreviewPage() {
  const { store, setStore, activeInvoice, invoiceTheme, setActiveInvoice } =
    useInvoiceStore();
  const onExport = () =>
    exportToPdf(
      store.activeInvoiceId ?? undefined,
      setActiveInvoice,
      "invoice-export"
    );

  return (
    <InvoiceShell
      store={store}
      setStore={setStore}
      onExport={onExport}
      exportTargetId="invoice-export"
      exportPreview={
        <InvoicePreview
          invoice={activeInvoice}
          currency={activeInvoice.preferences.currency}
          template={activeInvoice.preferences.template}
          theme={invoiceTheme}
          exportMode
        />
      }
      activeInvoice={activeInvoice}
    >
      <div className="space-y-6">
        <div>
          <InvoicePreview
            invoice={activeInvoice}
            currency={activeInvoice.preferences.currency}
            template={activeInvoice.preferences.template}
            theme={invoiceTheme}
          />
        </div>
      </div>
    </InvoiceShell>
  );
}

export function InvoiceLibraryPage() {
  const {
    store,
    setStore,
    activeInvoice,
    invoiceTheme,
    setActiveInvoice,
    addInvoice,
    deleteInvoice,
  } = useInvoiceStore();

  const onExport = () =>
    exportToPdf(
      store.activeInvoiceId ?? undefined,
      setActiveInvoice,
      "invoice-export"
    );

  return (
    <InvoiceShell
      store={store}
      setStore={setStore}
      onExport={onExport}
      exportTargetId="invoice-export"
      exportPreview={
        <InvoicePreview
          invoice={activeInvoice}
          currency={activeInvoice.preferences.currency}
          template={activeInvoice.preferences.template}
          theme={invoiceTheme}
          exportMode
        />
      }
      activeInvoice={activeInvoice}
    >
      <div className="no-print space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Library</CardTitle>
            <CardDescription>Manage saved invoices like files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Local storage only</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[hsl(var(--border))] text-xs">
                          i
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Your data never leaves this browser. Clearing history
                        removes invoices.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Your data never leaves this browser. Deleting history removes
                  the invoices permanently.
                </p>
              </div>
              <Button variant="secondary" onClick={addInvoice}>
                New invoice
              </Button>
            </div>
            <div className="max-h-[520px] space-y-2 overflow-auto">
              {store.invoices.map((invoice) => {
                const isActive = invoice.id === store.activeInvoiceId;
                return (
                  <div
                    key={invoice.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border border-[hsl(var(--border))] p-4 transition",
                      isActive && "bg-[hsl(var(--muted))]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">
                          {invoice.invoiceNumber || "Draft invoice"}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {invoice.clientName || "Untitled client"} ·{" "}
                          {formatTimestamp(invoice.updatedAt)}
                        </p>
                      </div>
                      {isActive ? (
                        <span className="rounded-full bg-[hsl(var(--primary))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveInvoice(invoice.id)}
                        asChild
                      >
                        <Link to="/edit">Open</Link>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          exportToPdf(invoice.id, setActiveInvoice, "invoice-export")
                        }
                      >
                        Export PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvoice(invoice.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </InvoiceShell>
  );
}

const InvoicePreview = ({
  invoice,
  currency,
  template,
  theme,
  exportMode = false,
}: {
  invoice: InvoiceData;
  currency: string;
  template: TemplateOption;
  theme: ThemeOption;
  exportMode?: boolean;
}) => {
  const totals = getTotals(invoice);
  const themePalette = getThemePalette(theme);
  const palette = getInvoicePalette(
    invoice.style.useCustomColors
      ? invoice.style.backgroundColor
      : themePalette.background,
    invoice.style.useCustomColors
      ? invoice.style.headerColor
      : themePalette.header
  );

  const wrapperStyle: React.CSSProperties = {
    backgroundColor: palette.background,
    color: palette.foreground,
    borderColor: palette.border,
    fontFamily: invoice.style.font,
    boxShadow:
      template === "modern"
        ? `0 28px 60px ${palette.backgroundShadow}`
        : undefined,
    borderRadius: exportMode ? 0 : undefined,
    minHeight: exportMode ? 1056 : undefined,
    boxSizing: "border-box",
    padding: exportMode ? "32px" : undefined,
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: palette.header,
    color: palette.headerForeground,
    boxShadow: `0 12px 40px ${palette.headerShadow}`,
  };

  const templateStyles =
    template === "classic"
      ? {
          body: "text-base",
          tableHeader: "bg-transparent border-b",
          totalsBox: "border rounded-lg",
        }
      : template === "minimal"
      ? {
          body: "text-sm",
          tableHeader: "bg-transparent border-b-0",
          totalsBox: "border-0 rounded-none",
        }
      : {
          body: "text-sm",
          tableHeader: "bg-[hsl(var(--muted))]",
          totalsBox: "border rounded-xl",
        };

  return (
    <div
      className={cn(
        "w-full space-y-6 border p-6",
        templateStyles.body,
        exportMode ? "rounded-none border-0" : "rounded-2xl",
        template === "minimal" &&
          !exportMode &&
          "border-transparent shadow-none"
      )}
      style={wrapperStyle}
    >
      <div
        className={cn("p-4", exportMode ? "rounded-none" : "rounded-xl")}
        style={headerStyle}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]">Invoice</p>
            <p className="text-2xl font-semibold">
              {invoice.meta.invoiceNumber || "Draft"}
            </p>
          </div>
          {invoice.logoData ? (
            <img
              src={invoice.logoData}
              alt="Invoice logo"
              className="h-12 w-auto max-w-[180px] rounded-md bg-white/70 p-2 object-contain sm:h-14"
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            {invoice.labels.from}
          </p>
          <p className="font-semibold">{invoice.from.name}</p>
          <p>{invoice.from.email}</p>
          <p>{invoice.from.phone}</p>
          <p className="whitespace-pre-line" style={{ color: palette.muted }}>
            {invoice.from.address}
          </p>
        </div>
        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            {invoice.labels.billTo}
          </p>
          <p className="font-semibold">{invoice.client.name}</p>
          <p>{invoice.client.email}</p>
          <p className="whitespace-pre-line" style={{ color: palette.muted }}>
            {invoice.client.address}
          </p>
          <p style={{ color: palette.muted }}>
            {invoice.labels.attnTo}: {invoice.client.attnTo}
          </p>
          <p style={{ color: palette.muted }}>
            {invoice.labels.shipTo}: {invoice.client.shipTo}
          </p>
        </div>
      </div>

      <Separator className="bg-[color:var(--invoice-border)]" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            {invoice.labels.issueDate}
          </p>
          <p>{invoice.meta.issueDate || "-"}</p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            {invoice.labels.paymentTerms}
          </p>
          <p>{invoice.meta.paymentTerms || "-"}</p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            {invoice.labels.paymentDate}
          </p>
          <p>{invoice.meta.paymentDate || "-"}</p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            {invoice.labels.dueDate}
          </p>
          <p>{invoice.meta.dueDate || "-"}</p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            {invoice.labels.poNumber}
          </p>
          <p>{invoice.meta.poNumber || "-"}</p>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border",
          exportMode ? "rounded-none" : "rounded-xl"
        )}
        style={{ borderColor: palette.border }}
      >
        <div
          className={cn(
            "grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide",
            templateStyles.tableHeader
          )}
          style={{
            backgroundColor:
              template === "modern" ? palette.mutedBg : "transparent",
          }}
        >
          <span>{invoice.labels.item}</span>
          <span>{invoice.labels.quantity}</span>
          <span>{invoice.labels.rate}</span>
          <span className="text-right">{invoice.labels.total}</span>
        </div>
        {invoice.items.map((item) => {
          const amount = parseAmount(item.quantity) * parseAmount(item.rate);
          return (
            <div
              key={item.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 border-t px-4 py-3"
              style={{ borderColor: palette.border }}
            >
              <div>
                <p className="font-medium">{item.name || "Item"}</p>
                {item.description ? (
                  <p className="text-xs" style={{ color: palette.muted }}>
                    {item.description}
                  </p>
                ) : null}
              </div>
              <p>{item.quantity || "0"}</p>
              <p>{item.rate || "0"}</p>
              <p className="text-right">{formatCurrency(amount, currency)}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: palette.muted }}
            >
              {invoice.labels.notes}
            </p>
            <p className="whitespace-pre-line" style={{ color: palette.muted }}>
              {invoice.notes || "-"}
            </p>
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: palette.muted }}
            >
              {invoice.labels.terms}
            </p>
            <p className="whitespace-pre-line" style={{ color: palette.muted }}>
              {invoice.terms || "-"}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "space-y-2 p-4",
            templateStyles.totalsBox,
            exportMode && "rounded-none"
          )}
          style={{ borderColor: palette.border }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs uppercase tracking-wide"
              style={{ color: palette.muted }}
            >
              {invoice.labels.subtotal}
            </span>
            <span>{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          {invoice.totals.taxEnabled ? (
            <div className="flex items-center justify-between">
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: palette.muted }}
              >
                {invoice.labels.tax}
              </span>
              <span>{formatCurrency(totals.tax, currency)}</span>
            </div>
          ) : null}
          {invoice.totals.discountEnabled ? (
            <div className="flex items-center justify-between">
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: palette.muted }}
              >
                {invoice.labels.discount}
              </span>
              <span>-{formatCurrency(totals.discount, currency)}</span>
            </div>
          ) : null}
          {invoice.totals.shippingEnabled ? (
            <div className="flex items-center justify-between">
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: palette.muted }}
              >
                {invoice.labels.shipping}
              </span>
              <span>{formatCurrency(totals.shipping, currency)}</span>
            </div>
          ) : null}
          <Separator className="bg-[color:var(--invoice-border)]" />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>{invoice.labels.total}</span>
            <span>{formatCurrency(totals.total, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>{invoice.labels.amountPaid}</span>
            <span>{formatCurrency(totals.amountPaid, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{invoice.labels.amountDue}</span>
            <span>{formatCurrency(totals.amountDue, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

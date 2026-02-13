import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { CalendarDays, Link2Off, Moon, Sun, Upload } from "lucide-react";
import { format, isValid, parse } from "date-fns";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  logoSize: "small" | "medium" | "large";
  logoPlacement: "tucked" | "prominent";
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
  folderId: string | null;
  data: InvoiceData;
};

type InvoiceFolder = {
  id: string;
  name: string;
  createdAt: string;
};

type StoreState = {
  invoices: StoredInvoice[];
  folders: InvoiceFolder[];
  activeInvoiceId: string | null;
  settings: {
    uiTheme: ThemeOption;
  };
};

const getDefaultUiTheme = (): ThemeOption => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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
      logoSize: "medium",
      logoPlacement: "tucked",
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

const parseAmount = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeLogoValue = (value: string) => value.trim();

const resolveLogoSource = (value: string) => {
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

const abbreviateFileName = (name: string, maxLength = 20) => {
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
    headerOverlay: rgba(headerRgb, 0.25),
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
      logoSize: base.style?.logoSize ?? "medium",
      logoPlacement: base.style?.logoPlacement ?? "tucked",
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
      folderId: null,
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
  const [isSupportOpen, setIsSupportOpen] = React.useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isEdit = pathname.startsWith("/edit");
  const isLibrary = pathname === "/" || pathname.startsWith("/library");
  const isPreviewPage = pathname.startsWith("/preview");

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-20">
      <header className="no-print sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/75 backdrop-blur">
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
                  Free invoice generator
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
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="no-print fixed bottom-6 right-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-lg shadow-lg transition hover:bg-[hsl(var(--muted))]"
            aria-label="Support this project"
          >
            ❤️
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support this project</DialogTitle>
            <DialogDescription className="space-y-3 text-sm">
              <p>
                This website is inspired by invoice-generator.com. After using
                it for years, I was disappointed to find it riddled with ads.
              </p>
              <p>
                My commitment is to pay to host this out of pocket and never
                collect ad revenue or payments from users of any kind, as long
                as it remains useful to myself or anyone else.
              </p>
              <p>
                Any donations would be very helpful. Currently, the domain is
                $1.20 per month and hosting is free, but if usage increases,
                costs will go up as well. Thank you!
              </p>
            </DialogDescription>
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3 text-left text-sm">
              Wallet:{" "}
              <span className="font-mono">
                0xc17510C86bE51FB1ba32FbD6ab2bD7a83A4A89dE
              </span>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
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
  const logoUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [logoFileName, setLogoFileName] = React.useState("");
  const hasUploadedLogo = normalizeLogoValue(activeInvoice.logoData).startsWith(
    "data:"
  );
  const uploadButtonLabel = logoFileName
    ? abbreviateFileName(logoFileName)
    : hasUploadedLogo
    ? "Change logo"
    : "Upload logo";

  React.useEffect(() => {
    if (!normalizeLogoValue(activeInvoice.logoData).startsWith("data:")) {
      setLogoFileName("");
    }
  }, [activeInvoice.logoData]);

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    setLogoFileName(file.name);
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

  const DatePickerField = ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }) => {
    const displayFormat = "MM/dd/yyyy";
    const [open, setOpen] = React.useState(false);
    const today = new Date();
    const startMonth = new Date(today.getFullYear() - 100, 0, 1);
    const endMonth = new Date(today.getFullYear() + 100, 11, 31);
    const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
    const selected = parsed && isValid(parsed) ? parsed : undefined;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-empty={!selected}
            className="w-full justify-between font-normal data-[empty=true]:text-[hsl(var(--muted-foreground))]"
          >
            <span>
              {selected ? format(selected, displayFormat) : placeholder}
            </span>
            <CalendarDays className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          avoidCollisions={false}
          sideOffset={8}
          className="w-auto overflow-hidden p-0"
        >
          <Calendar
            mode="single"
            selected={selected}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            defaultMonth={selected}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
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
            <TabsList className="flex w-full justify-start bg-transparent">
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
                              normalizeLogoValue(activeInvoice.logoData).startsWith(
                                "data:"
                              )
                                ? ""
                                : activeInvoice.logoData
                            }
                            onChange={(event) =>
                              updateInvoice((data) => ({
                                ...data,
                                logoData: resolveLogoSource(event.target.value),
                              }))
                            }
                          />
                          <input
                            ref={logoUploadInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                              handleLogoUpload(event.target.files?.[0] ?? null)
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="justify-self-start"
                            onClick={() => logoUploadInputRef.current?.click()}
                            title={logoFileName || undefined}
                          >
                            <Upload className="h-4 w-4" />
                            {uploadButtonLabel}
                          </Button>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] sm:col-span-2">
                            {logoFileName ||
                              (normalizeLogoValue(activeInvoice.logoData).startsWith(
                                "data:"
                              )
                                ? "Uploaded image selected"
                                : "PNG, JPG, SVG, WEBP")}
                          </p>
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
                    <DatePickerField
                      value={activeInvoice.meta.issueDate}
                      onChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: { ...data.meta, issueDate: value },
                        }))
                      }
                      placeholder="mm/dd/yyyy"
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.paymentDate}
                    onLabelChange={(value) => updateLabel("paymentDate", value)}
                  >
                    <DatePickerField
                      value={activeInvoice.meta.paymentDate}
                      onChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: { ...data.meta, paymentDate: value },
                        }))
                      }
                      placeholder="mm/dd/yyyy"
                    />
                  </Field>
                  <Field
                    label={activeInvoice.labels.dueDate}
                    onLabelChange={(value) => updateLabel("dueDate", value)}
                  >
                    <DatePickerField
                      value={activeInvoice.meta.dueDate}
                      onChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          meta: { ...data.meta, dueDate: value },
                        }))
                      }
                      placeholder="mm/dd/yyyy"
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
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                      Logo size
                    </Label>
                    <Select
                      value={activeInvoice.style.logoSize}
                      onValueChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          style: {
                            ...data.style,
                            logoSize: value as "small" | "medium" | "large",
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Logo size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                      Logo placement
                    </Label>
                    <Select
                      value={activeInvoice.style.logoPlacement}
                      onValueChange={(value) =>
                        updateInvoice((data) => ({
                          ...data,
                          style: {
                            ...data.style,
                            logoPlacement: value as "tucked" | "prominent",
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Logo placement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tucked">Tucked</SelectItem>
                        <SelectItem value="prominent">Prominent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
  const {
    store,
    setStore,
    activeInvoice,
    invoiceTheme,
    setActiveInvoice,
    updateInvoice,
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
      <div className="space-y-6">
        <div>
          <InvoicePreview
            invoice={activeInvoice}
            currency={activeInvoice.preferences.currency}
            template={activeInvoice.preferences.template}
            theme={invoiceTheme}
            onUpdate={updateInvoice}
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
  const [selectedFolderId, setSelectedFolderId] = React.useState<string>("all");
  const [newFolderName, setNewFolderName] = React.useState("");
  const [folderToDelete, setFolderToDelete] =
    React.useState<InvoiceFolder | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = React.useState<string | null>(
    null
  );

  const onExport = () =>
    exportToPdf(
      store.activeInvoiceId ?? undefined,
      setActiveInvoice,
      "invoice-export"
    );

  const folders = store.folders ?? [];
  const visibleInvoices = store.invoices.filter((invoice) => {
    if (selectedFolderId === "all") return true;
    if (selectedFolderId === "unfiled") return !invoice.folderId;
    return invoice.folderId === selectedFolderId;
  });

  const addFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const folder: InvoiceFolder = {
      id: nanoid(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    setStore((current) => ({
      ...current,
      folders: [...(current.folders ?? []), folder],
    }));
    setNewFolderName("");
  };

  const removeFolder = (folderId: string) => {
    setStore((current) => ({
      ...current,
      folders: (current.folders ?? []).filter(
        (folder) => folder.id !== folderId
      ),
      invoices: current.invoices.map((invoice) =>
        invoice.folderId === folderId ? { ...invoice, folderId: null } : invoice
      ),
    }));
    if (selectedFolderId === folderId) {
      setSelectedFolderId("all");
    }
  };

  const handleDrop = (folderId: string | null) => (event: React.DragEvent) => {
    event.preventDefault();
    const invoiceId = event.dataTransfer.getData("text/plain");
    if (!invoiceId) return;
    setStore((current) => ({
      ...current,
      invoices: current.invoices.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, folderId } : invoice
      ),
    }));
    setDragOverFolderId(null);
  };

  const startDrag = (invoiceId: string) => (event: React.DragEvent) => {
    event.dataTransfer.setData("text/plain", invoiceId);
    event.dataTransfer.effectAllowed = "move";
  };

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
            <CardDescription className="text-wrap whitespace-pre-wrap text-foreground/60">
              This is where your <strong>invoices</strong> are stored. You can{" "}
              <strong>create folders</strong> and <strong>drag invoices</strong>{" "}
              into folders to keep them <strong>organized</strong>. Your
              invoices are stored <strong>locally</strong> in{" "}
              <strong>browser local storage</strong> and are{" "}
              <strong>not shared</strong> with anyone or{" "}
              <strong>stored on a server</strong>. If you{" "}
              <strong>clear your browser history</strong>, your invoices will be{" "}
              <strong>deleted</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="secondary" onClick={addInvoice}>
                New invoice
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                    Folders
                  </Label>
                </div>
                <div className="space-y-2">
                  <Button
                    variant={selectedFolderId === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFolderId("all")}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop(null)}
                    onDragEnter={() => setDragOverFolderId("all")}
                    onDragLeave={() => setDragOverFolderId(null)}
                    className={cn(
                      "w-full justify-start",
                      dragOverFolderId === "all" &&
                        "ring-2 ring-[hsl(var(--primary))]"
                    )}
                  >
                    All invoices
                  </Button>
                  <Button
                    variant={
                      selectedFolderId === "unfiled" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedFolderId("unfiled")}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop(null)}
                    onDragEnter={() => setDragOverFolderId("unfiled")}
                    onDragLeave={() => setDragOverFolderId(null)}
                    className={cn(
                      "w-full justify-start",
                      dragOverFolderId === "unfiled" &&
                        "ring-2 ring-[hsl(var(--primary))]"
                    )}
                  >
                    Unfiled
                  </Button>
                  {folders.map((folder) => (
                    <div key={folder.id} className="flex items-center gap-2">
                      <Button
                        variant={
                          selectedFolderId === folder.id ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedFolderId(folder.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleDrop(folder.id)}
                        onDragEnter={() => setDragOverFolderId(folder.id)}
                        onDragLeave={() => setDragOverFolderId(null)}
                        className={cn(
                          "w-full justify-start",
                          dragOverFolderId === folder.id &&
                            "ring-2 ring-[hsl(var(--primary))]"
                        )}
                      >
                        {folder.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFolderToDelete(folder)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  <div className="grid gap-2">
                    <Input
                      placeholder="New folder name"
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                    />
                    <Button variant="outline" onClick={addFolder}>
                      Add folder
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs text-[hsl(var(--muted-foreground))]">
                  Invoices
                </Label>
                <div className="max-h-[calc(100vh-320px)] min-h-[260px] space-y-2 overflow-auto">
                  {visibleInvoices.map((invoice) => {
                    const isActive = invoice.id === store.activeInvoiceId;
                    return (
                      <div
                        key={invoice.id}
                        draggable
                        onDragStart={startDrag(invoice.id)}
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
                              exportToPdf(
                                invoice.id,
                                setActiveInvoice,
                                "invoice-export"
                              )
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
              </div>
            </div>
            <Dialog
              open={Boolean(folderToDelete)}
              onOpenChange={() => setFolderToDelete(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete folder?</DialogTitle>
                  <DialogDescription>
                    This will remove the folder and move its invoices back to
                    Unfiled.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setFolderToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (folderToDelete) {
                        removeFolder(folderToDelete.id);
                        setFolderToDelete(null);
                      }
                    }}
                  >
                    Delete folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </InvoiceShell>
  );
}

const InlineEditableText = ({
  value,
  onChange,
  className,
  multiline = false,
  placeholder = "",
}: {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [value, editing]);

  const commit = () => {
    if (!onChange) return;
    onChange(draft);
    setEditing(false);
  };

  const displayValue = value || placeholder || "—";

  if (!onChange) {
    return <span className={className}>{displayValue}</span>;
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          className={cn(
            "min-h-[72px] w-full resize-none rounded-md border border-[hsl(var(--border))] bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
            className
          )}
          autoFocus
        />
      );
    }

    return (
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
          }
        }}
        className={cn(
          "w-full rounded-md border border-[hsl(var(--border))] bg-transparent p-1 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
          className
        )}
        autoFocus
      />
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "h-4 w-full cursor-text text-left text-[hsl(var(--muted-foreground))]",
          className
        )}
        aria-label="Edit field"
      >
        {displayValue}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn("cursor-text text-left", className)}
    >
      {displayValue}
    </button>
  );
};

const InvoicePreview = ({
  invoice,
  currency,
  template,
  theme,
  exportMode = false,
  onUpdate,
}: {
  invoice: InvoiceData;
  currency: string;
  template: TemplateOption;
  theme: ThemeOption;
  exportMode?: boolean;
  onUpdate?: (updater: (data: InvoiceData) => InvoiceData) => void;
}) => {
  const totals = getTotals(invoice);
  const canEdit = Boolean(onUpdate) && !exportMode;
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
    minHeight: exportMode ? 1056 : undefined,
    boxSizing: "border-box",
    padding: exportMode ? "32px" : undefined,
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: palette.headerOverlay,
    color: palette.headerForeground,
  };

  const templateStyles =
    template === "classic"
      ? {
          body: "text-base",
          tableHeader: "bg-transparent border-b",
          totalsBox: "border rounded-none",
          wrapperRadius: "rounded-none",
          headerRadius: "rounded-none",
          tableRadius: "rounded-none",
        }
      : template === "minimal"
      ? {
          body: "text-sm",
          tableHeader: "bg-transparent border-b-0",
          totalsBox: "border-0 rounded-none",
          wrapperRadius: "rounded-none",
          headerRadius: "rounded-none",
          tableRadius: "rounded-none",
        }
      : {
          body: "text-sm",
          tableHeader: "bg-[hsl(var(--muted))]",
          totalsBox: "border rounded-xl",
          wrapperRadius: exportMode ? "rounded-none" : "rounded-2xl",
          headerRadius: "rounded-xl",
          tableRadius: "rounded-xl",
        };

  const logoSizeClass =
    invoice.style.logoSize === "large"
      ? "h-[6.5rem]"
      : invoice.style.logoSize === "small"
      ? "h-14"
      : "h-20";
  const logoSource = resolveLogoSource(invoice.logoData);

  return (
    <div
      className={cn(
        "w-full space-y-6 border p-6",
        templateStyles.body,
        templateStyles.wrapperRadius,
        template === "minimal" &&
          !exportMode &&
          "border-transparent shadow-none"
      )}
      style={wrapperStyle}
    >
      <div className={cn("p-4", templateStyles.headerRadius)} style={headerStyle}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]">
              <InlineEditableText
                value={invoice.labels.invoiceNumber}
                placeholder="Invoice"
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          labels: { ...data.labels, invoiceNumber: value },
                        }))
                    : undefined
                }
              />
            </p>
            <p className="text-2xl font-semibold">
              <InlineEditableText
                value={invoice.meta.invoiceNumber}
                placeholder="Draft"
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          meta: { ...data.meta, invoiceNumber: value },
                        }))
                    : undefined
                }
                className="font-semibold"
              />
            </p>
          </div>
          {logoSource && invoice.style.logoPlacement === "tucked" ? (
            <img
              src={logoSource}
              alt="Invoice logo"
              className={cn(
                "w-auto object-contain",
                logoSizeClass,
                "max-w-[220px]"
              )}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          {logoSource && invoice.style.logoPlacement === "prominent" ? (
            <img
              src={logoSource}
              alt="Invoice logo"
              className={cn(
                "mb-3 w-auto object-contain",
                logoSizeClass,
                "max-w-[260px]"
              )}
            />
          ) : null}
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            <InlineEditableText
              value={invoice.labels.from}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, from: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p className="font-semibold">
            <InlineEditableText
              value={invoice.from.name}
              placeholder="Business name"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        from: { ...data.from, name: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.from.email}
              placeholder="Email"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        from: { ...data.from, email: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.from.phone}
              placeholder="Phone"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        from: { ...data.from, phone: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p className="whitespace-pre-line" style={{ color: palette.muted }}>
            <InlineEditableText
              value={invoice.from.address}
              placeholder="Address"
              multiline
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        from: { ...data.from, address: value },
                      }))
                  : undefined
              }
              className="whitespace-pre-line"
            />
          </p>
        </div>
        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            <InlineEditableText
              value={invoice.labels.billTo}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, billTo: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p className="font-semibold">
            <InlineEditableText
              value={invoice.client.name}
              placeholder="Client name"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        client: { ...data.client, name: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.client.email}
              placeholder="Client email"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        client: { ...data.client, email: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p className="whitespace-pre-line" style={{ color: palette.muted }}>
            <InlineEditableText
              value={invoice.client.address}
              placeholder="Client address"
              multiline
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        client: { ...data.client, address: value },
                      }))
                  : undefined
              }
              className="whitespace-pre-line"
            />
          </p>
          <p style={{ color: palette.muted }}>
            <InlineEditableText
              value={invoice.labels.attnTo}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, attnTo: value },
                      }))
                  : undefined
              }
            />
            :{" "}
            <InlineEditableText
              value={invoice.client.attnTo}
              placeholder="Attn"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        client: { ...data.client, attnTo: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p style={{ color: palette.muted }}>
            <InlineEditableText
              value={invoice.labels.shipTo}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, shipTo: value },
                      }))
                  : undefined
              }
            />
            :{" "}
            <InlineEditableText
              value={invoice.client.shipTo}
              placeholder="Ship to"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        client: { ...data.client, shipTo: value },
                      }))
                  : undefined
              }
            />
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
            <InlineEditableText
              value={invoice.labels.issueDate}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, issueDate: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.meta.issueDate}
              placeholder="-"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        meta: { ...data.meta, issueDate: value },
                      }))
                  : undefined
              }
            />
          </p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            <InlineEditableText
              value={invoice.labels.paymentTerms}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, paymentTerms: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.meta.paymentTerms}
              placeholder="-"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        meta: { ...data.meta, paymentTerms: value },
                      }))
                  : undefined
              }
            />
          </p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            <InlineEditableText
              value={invoice.labels.paymentDate}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, paymentDate: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.meta.paymentDate}
              placeholder="-"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        meta: { ...data.meta, paymentDate: value },
                      }))
                  : undefined
              }
            />
          </p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            <InlineEditableText
              value={invoice.labels.dueDate}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, dueDate: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.meta.dueDate}
              placeholder="-"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        meta: { ...data.meta, dueDate: value },
                      }))
                  : undefined
              }
            />
          </p>
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: palette.muted }}
          >
            <InlineEditableText
              value={invoice.labels.poNumber}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, poNumber: value },
                      }))
                  : undefined
              }
            />
          </p>
          <p>
            <InlineEditableText
              value={invoice.meta.poNumber}
              placeholder="-"
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        meta: { ...data.meta, poNumber: value },
                      }))
                  : undefined
              }
            />
          </p>
        </div>
      </div>

      <div
        className={cn("overflow-hidden border", templateStyles.tableRadius)}
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
          <span>
            <InlineEditableText
              value={invoice.labels.item}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, item: value },
                      }))
                  : undefined
              }
            />
          </span>
          <span>
            <InlineEditableText
              value={invoice.labels.quantity}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, quantity: value },
                      }))
                  : undefined
              }
            />
          </span>
          <span>
            <InlineEditableText
              value={invoice.labels.rate}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, rate: value },
                      }))
                  : undefined
              }
            />
          </span>
          <span className="text-right">
            <InlineEditableText
              value={invoice.labels.total}
              onChange={
                canEdit
                  ? (value) =>
                      onUpdate?.((data) => ({
                        ...data,
                        labels: { ...data.labels, total: value },
                      }))
                  : undefined
              }
            />
          </span>
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
                <p className="font-medium">
                  <InlineEditableText
                    value={item.name}
                    placeholder="Item"
                    onChange={
                      canEdit
                        ? (value) =>
                            onUpdate?.((data) => ({
                              ...data,
                              items: data.items.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, name: value }
                                  : entry
                              ),
                            }))
                        : undefined
                    }
                  />
                </p>
                <p className="text-xs" style={{ color: palette.muted }}>
                  <InlineEditableText
                    value={item.description}
                    placeholder="Description"
                    onChange={
                      canEdit
                        ? (value) =>
                            onUpdate?.((data) => ({
                              ...data,
                              items: data.items.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, description: value }
                                  : entry
                              ),
                            }))
                        : undefined
                    }
                  />
                </p>
              </div>
              <p>
                <InlineEditableText
                  value={item.quantity}
                  placeholder="0"
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((data) => ({
                            ...data,
                            items: data.items.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, quantity: value }
                                : entry
                            ),
                          }))
                      : undefined
                  }
                />
              </p>
              <p>
                <InlineEditableText
                  value={item.rate}
                  placeholder="0"
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((data) => ({
                            ...data,
                            items: data.items.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, rate: value }
                                : entry
                            ),
                          }))
                      : undefined
                  }
                />
              </p>
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
              <InlineEditableText
                value={invoice.labels.notes}
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          labels: { ...data.labels, notes: value },
                        }))
                    : undefined
                }
              />
            </p>
            <p className="whitespace-pre-line" style={{ color: palette.muted }}>
              <InlineEditableText
                value={invoice.notes}
                placeholder="-"
                multiline
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          notes: value,
                        }))
                    : undefined
                }
                className="whitespace-pre-line"
              />
            </p>
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: palette.muted }}
            >
              <InlineEditableText
                value={invoice.labels.terms}
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          labels: { ...data.labels, terms: value },
                        }))
                    : undefined
                }
              />
            </p>
            <p className="whitespace-pre-line" style={{ color: palette.muted }}>
              <InlineEditableText
                value={invoice.terms}
                placeholder="-"
                multiline
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          terms: value,
                        }))
                    : undefined
                }
                className="whitespace-pre-line"
              />
            </p>
          </div>
        </div>
        <div
          className={cn("space-y-2 p-4", templateStyles.totalsBox)}
          style={{ borderColor: palette.border }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs uppercase tracking-wide"
              style={{ color: palette.muted }}
            >
              <InlineEditableText
                value={invoice.labels.subtotal}
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          labels: { ...data.labels, subtotal: value },
                        }))
                    : undefined
                }
              />
            </span>
            <span>{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          {invoice.totals.taxEnabled ? (
            <div className="flex items-center justify-between">
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: palette.muted }}
              >
                <InlineEditableText
                  value={invoice.labels.tax}
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((data) => ({
                            ...data,
                            labels: { ...data.labels, tax: value },
                          }))
                      : undefined
                  }
                />
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
                <InlineEditableText
                  value={invoice.labels.discount}
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((data) => ({
                            ...data,
                            labels: { ...data.labels, discount: value },
                          }))
                      : undefined
                  }
                />
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
                <InlineEditableText
                  value={invoice.labels.shipping}
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((data) => ({
                            ...data,
                            labels: { ...data.labels, shipping: value },
                          }))
                      : undefined
                  }
                />
              </span>
              <span>{formatCurrency(totals.shipping, currency)}</span>
            </div>
          ) : null}
          <Separator className="bg-[color:var(--invoice-border)]" />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>
              <InlineEditableText
                value={invoice.labels.total}
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          labels: { ...data.labels, total: value },
                        }))
                    : undefined
                }
              />
            </span>
            <span>{formatCurrency(totals.total, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>
              <InlineEditableText
                value={invoice.labels.amountPaid}
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          labels: { ...data.labels, amountPaid: value },
                        }))
                    : undefined
                }
              />
            </span>
            <span>{formatCurrency(totals.amountPaid, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>
              <InlineEditableText
                value={invoice.labels.amountDue}
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((data) => ({
                          ...data,
                          labels: { ...data.labels, amountDue: value },
                        }))
                    : undefined
                }
              />
            </span>
            <span>{formatCurrency(totals.amountDue, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

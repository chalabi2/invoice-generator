import * as React from "react";
import { nanoid } from "nanoid";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  InvoiceData,
  TemplateOption,
  ThemeOption,
} from "@/features/invoice/types";
import {
  formatCurrency,
  getInvoicePalette,
  getThemePalette,
  getTotals,
  parseAmount,
  resolveLogoSource,
} from "@/features/invoice/lib/utils";

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
  const hasValue = Boolean(value);
  const displayValue = value || placeholder || "-";

  if (!onChange) {
    return <span className={className}>{displayValue}</span>;
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-h-[72px] w-full resize-none rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-sm placeholder:text-[hsl(var(--foreground))]/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
          !hasValue && "italic",
          className
        )}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm placeholder:text-[hsl(var(--foreground))]/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
        !hasValue && "italic",
        className
      )}
    />
  );
};

export const InvoicePreview = ({
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
  const logoUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const themePalette = getThemePalette(theme);
  const palette = getInvoicePalette(
    invoice.style.useCustomColors
      ? invoice.style.backgroundColor
      : themePalette.background,
    invoice.style.useCustomColors ? invoice.style.headerColor : themePalette.header
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

  const balanceDueStyle: React.CSSProperties = {
    backgroundColor: template === "minimal" ? palette.border : palette.headerOverlay,
    color: template === "minimal" ? palette.foreground : palette.headerForeground,
  };

  const templateStyles =
    template === "classic"
      ? {
          body: "text-base",
          tableHeader: "border-b-2",
          wrapperRadius: "rounded-none",
          tableRadius: "rounded-none",
          balanceDueRadius: "rounded-none",
        }
      : template === "minimal"
        ? {
            body: "text-sm",
            tableHeader: "border-b",
            wrapperRadius: "rounded-none",
            tableRadius: "rounded-none",
            balanceDueRadius: "rounded-none",
          }
        : {
            body: "text-sm",
            tableHeader: "",
            wrapperRadius: exportMode ? "rounded-none" : "rounded-2xl",
            tableRadius: "rounded-xl",
            balanceDueRadius: "rounded-xl",
          };

  const logoSizeClass =
    invoice.style.logoSize === "large"
      ? "h-[6.5rem]"
      : invoice.style.logoSize === "small"
        ? "h-14"
        : "h-20";
  const logoSlotClass =
    invoice.style.logoSize === "large"
      ? "h-[6.5rem] w-[260px]"
      : invoice.style.logoSize === "small"
        ? "h-14 w-[180px]"
        : "h-20 w-[220px]";
  const logoSource = resolveLogoSource(invoice.logoData);

  const labelUpdater = (key: keyof InvoiceData["labels"]) =>
    canEdit
      ? (value: string) =>
          onUpdate?.((data) => ({
            ...data,
            labels: { ...data.labels, [key]: value },
          }))
      : undefined;

  const hasNotes = invoice.notes?.trim();
  const hasTerms = invoice.terms?.trim();

  return (
    <div
      className={cn(
        "w-full border p-6",
        templateStyles.body,
        templateStyles.wrapperRadius,
        template === "minimal" && !exportMode && "border-transparent shadow-none"
      )}
      style={wrapperStyle}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <input
            ref={logoUploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                onUpdate?.((data) => ({
                  ...data,
                  logoData: String(reader.result || ""),
                }));
              };
              reader.readAsDataURL(file);
            }}
          />
          {canEdit ? (
            <button
              type="button"
              onClick={() => logoUploadInputRef.current?.click()}
              className={cn(
                "flex items-center justify-center rounded-md border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 transition hover:bg-[hsl(var(--muted))]",
                logoSlotClass,
              )}
            >
              {logoSource ? (
                <img
                  src={logoSource}
                  alt="Invoice logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Upload className="h-4 w-4" />
                  Upload logo
                </span>
              )}
            </button>
          ) : logoSource ? (
            <img
              src={logoSource}
              alt="Invoice logo"
              className={cn("h-auto w-auto object-contain", logoSizeClass, "max-w-[260px]")}
            />
          ) : null}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-semibold uppercase tracking-wide">
            <InlineEditableText
              value={invoice.labels.invoiceNumber}
              placeholder="Invoice"
              onChange={labelUpdater("invoiceNumber")}
              className="font-bold"
            />
          </h1>
          <p className="mt-2 text-sm" style={{ color: palette.muted }}>
            <InlineEditableText value={invoice.meta.invoiceNumber} placeholder="Draft" onChange={canEdit ? (value) => onUpdate?.((data) => ({ ...data, meta: { ...data.meta, invoiceNumber: value } })) : undefined} />
          </p>
        </div>
      </div>

      <div className="mb-8 mt-1 grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="max-w-[22rem] space-y-2">
          <p className="text-lg font-semibold">
            <InlineEditableText
              value={invoice.from.name}
              placeholder="Business name"
              onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, from: { ...d.from, name: value } })) : undefined}
              className="max-w-[22rem]"
            />
          </p>
          {(invoice.from.email?.trim() || canEdit) && (
            <p className="text-sm" style={{ color: palette.muted }}>
              <InlineEditableText
                value={invoice.from.email}
                placeholder="Email"
                onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, from: { ...d.from, email: value } })) : undefined}
                className="max-w-[22rem]"
              />
            </p>
          )}
          {(invoice.from.phone?.trim() || canEdit) && (
            <p className="text-sm" style={{ color: palette.muted }}>
              <InlineEditableText
                value={invoice.from.phone}
                placeholder="Phone"
                onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, from: { ...d.from, phone: value } })) : undefined}
                className="max-w-[22rem]"
              />
            </p>
          )}
          {(invoice.from.address?.trim() || canEdit) && (
            <p className="whitespace-pre-line text-sm" style={{ color: palette.muted }}>
              <InlineEditableText
                value={invoice.from.address}
                placeholder="Address"
                multiline
                onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, from: { ...d.from, address: value } })) : undefined}
                className="max-w-[22rem] whitespace-pre-line"
              />
            </p>
          )}

          <div className="mt-6 space-y-2">
            <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-2 text-sm" style={{ color: palette.muted }}>
              <InlineEditableText
                value={invoice.labels.billTo}
                onChange={labelUpdater("billTo")}
              />
              <InlineEditableText
                value={invoice.client.name}
                placeholder="Client name"
                onChange={
                  canEdit
                    ? (value) =>
                        onUpdate?.((d) => ({
                          ...d,
                          client: { ...d.client, name: value },
                        }))
                    : undefined
                }
                className="max-w-[22rem]"
              />
            </div>
            {(invoice.client.attnTo?.trim() || canEdit) && (
              <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-2 text-sm" style={{ color: palette.muted }}>
                <InlineEditableText
                  value={invoice.labels.attnTo}
                  onChange={labelUpdater("attnTo")}
                />
                <InlineEditableText
                  value={invoice.client.attnTo}
                  placeholder="Attn"
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((d) => ({
                            ...d,
                            client: { ...d.client, attnTo: value },
                          }))
                      : undefined
                  }
                  className="max-w-[22rem]"
                />
              </div>
            )}
            {(invoice.client.email?.trim() || canEdit) && (
              <p className="text-sm" style={{ color: palette.muted }}>
                <InlineEditableText
                  value={invoice.client.email}
                  placeholder="Client email"
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((d) => ({
                            ...d,
                            client: { ...d.client, email: value },
                          }))
                      : undefined
                  }
                  className="max-w-[22rem]"
                />
              </p>
            )}
            {(invoice.client.address?.trim() || canEdit) && (
              <p className="whitespace-pre-line text-sm" style={{ color: palette.muted }}>
                <InlineEditableText
                  value={invoice.client.address}
                  placeholder="Client address"
                  multiline
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((d) => ({
                            ...d,
                            client: { ...d.client, address: value },
                          }))
                      : undefined
                  }
                  className="max-w-[22rem] whitespace-pre-line"
                />
              </p>
            )}
            {(invoice.client.shipTo?.trim() || canEdit) && (
              <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-2 text-sm" style={{ color: palette.muted }}>
                <InlineEditableText
                  value={invoice.labels.shipTo}
                  onChange={labelUpdater("shipTo")}
                />
                <InlineEditableText
                  value={invoice.client.shipTo}
                  placeholder="Ship to"
                  onChange={
                    canEdit
                      ? (value) =>
                          onUpdate?.((d) => ({
                            ...d,
                            client: { ...d.client, shipTo: value },
                          }))
                      : undefined
                  }
                  className="max-w-[22rem]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
              {(invoice.meta.issueDate?.trim() || canEdit) && (
                <>
                  <span className="text-right text-sm" style={{ color: palette.muted }}>
                    <InlineEditableText value={invoice.labels.issueDate} onChange={labelUpdater("issueDate")} />
                  </span>
                  <span className="text-right text-sm font-medium">
                    <InlineEditableText
                      value={invoice.meta.issueDate}
                      placeholder="-"
                      onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, meta: { ...d.meta, issueDate: value } })) : undefined}
                    />
                  </span>
                </>
              )}

              {(invoice.meta.paymentTerms?.trim() || canEdit) && (
                <>
                  <span className="text-right text-sm" style={{ color: palette.muted }}>
                    <InlineEditableText value={invoice.labels.paymentTerms} onChange={labelUpdater("paymentTerms")} />
                  </span>
                  <span className="text-right text-sm font-medium">
                    <InlineEditableText
                      value={invoice.meta.paymentTerms}
                      placeholder="-"
                      onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, meta: { ...d.meta, paymentTerms: value } })) : undefined}
                    />
                  </span>
                </>
              )}

              {(invoice.meta.dueDate?.trim() || canEdit) && (
                <>
                  <span className="text-right text-sm" style={{ color: palette.muted }}>
                    <InlineEditableText value={invoice.labels.dueDate} onChange={labelUpdater("dueDate")} />
                  </span>
                  <span className="text-right text-sm font-medium">
                    <InlineEditableText
                      value={invoice.meta.dueDate}
                      placeholder="-"
                      onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, meta: { ...d.meta, dueDate: value } })) : undefined}
                    />
                  </span>
                </>
              )}

              {(invoice.meta.poNumber?.trim() || canEdit) && (
                <>
                  <span className="text-right text-sm" style={{ color: palette.muted }}>
                    <InlineEditableText value={invoice.labels.poNumber} onChange={labelUpdater("poNumber")} />
                  </span>
                  <span className="text-right text-sm font-medium">
                    <InlineEditableText
                      value={invoice.meta.poNumber}
                      placeholder="-"
                      onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, meta: { ...d.meta, poNumber: value } })) : undefined}
                    />
                  </span>
                </>
              )}

              {(invoice.meta.paymentDate?.trim() || canEdit) && (
                <>
                  <span className="text-right text-sm" style={{ color: palette.muted }}>
                    <InlineEditableText value={invoice.labels.paymentDate} onChange={labelUpdater("paymentDate")} />
                  </span>
                  <span className="text-right text-sm font-medium">
                    <InlineEditableText
                      value={invoice.meta.paymentDate}
                      placeholder="-"
                      onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, meta: { ...d.meta, paymentDate: value } })) : undefined}
                    />
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <div
              className={cn(
                "flex shrink-0 items-center gap-3 px-4 py-2 font-semibold",
                templateStyles.balanceDueRadius
              )}
              style={balanceDueStyle}
            >
              <span>
                <InlineEditableText value={invoice.labels.amountDue} onChange={labelUpdater("amountDue")} />
              </span>
              <span className="text-xl font-bold">{formatCurrency(totals.amountDue, currency)}</span>
            </div>
          </div>
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
              template === "classic" || template === "minimal"
                ? "transparent"
                : palette.headerOverlay,
            color:
              template === "classic" || template === "minimal"
                ? palette.muted
                : palette.headerForeground,
            borderColor: palette.border,
          }}
        >
          <span>
            <InlineEditableText value={invoice.labels.item} onChange={labelUpdater("item")} />
          </span>
          <span>
            <InlineEditableText value={invoice.labels.quantity} onChange={labelUpdater("quantity")} />
          </span>
          <span>
            <InlineEditableText value={invoice.labels.rate} onChange={labelUpdater("rate")} />
          </span>
          <span className="text-right">Amount</span>
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
                <div className="space-y-2">
                  <p className="font-medium">
                    <InlineEditableText
                      value={item.name}
                      placeholder="Item"
                      onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, items: d.items.map((e) => (e.id === item.id ? { ...e, name: value } : e)) })) : undefined}
                    />
                  </p>
                  <p className="text-xs" style={{ color: palette.muted }}>
                    <InlineEditableText
                      value={item.description}
                      placeholder="Description"
                      onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, items: d.items.map((e) => (e.id === item.id ? { ...e, description: value } : e)) })) : undefined}
                    />
                  </p>
                </div>
              </div>
              <p>
                <InlineEditableText
                  value={item.quantity}
                  placeholder="0"
                  onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, items: d.items.map((e) => (e.id === item.id ? { ...e, quantity: value } : e)) })) : undefined}
                />
              </p>
              <p>
                <InlineEditableText
                  value={item.rate}
                  placeholder="0"
                  onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, items: d.items.map((e) => (e.id === item.id ? { ...e, rate: value } : e)) })) : undefined}
                />
              </p>
              <p className="text-right">{formatCurrency(amount, currency)}</p>
            </div>
          );
        })}
        {canEdit && (
          <div className="border-t px-4 py-3" style={{ borderColor: palette.border }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newItem = {
                  id: nanoid(),
                  name: "",
                  description: "",
                  quantity: "1",
                  rate: "0",
                };
                onUpdate?.((d) => ({ ...d, items: [...d.items, newItem] }));
              }}
              className="text-xs"
            >
              + Add Line Item
            </Button>
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-end">
        <div className="grid min-w-[260px] grid-cols-[auto_auto] gap-x-4 gap-y-1">
          <span className="text-right text-sm" style={{ color: palette.muted }}>
            <InlineEditableText value={invoice.labels.subtotal} onChange={labelUpdater("subtotal")} />
          </span>
          <span className="text-right text-sm font-medium">{formatCurrency(totals.subtotal, currency)}</span>

          {invoice.totals.taxEnabled ? (
            <>
              <span className="text-right text-sm" style={{ color: palette.muted }}>
                <InlineEditableText value={invoice.labels.tax} onChange={labelUpdater("tax")} />
                {invoice.totals.taxType === "percent" ? ` (${invoice.totals.taxValue}%)` : ""}
              </span>
              <span className="text-right text-sm font-medium">{formatCurrency(totals.tax, currency)}</span>
            </>
          ) : null}

          {invoice.totals.discountEnabled ? (
            <>
              <span className="text-right text-sm" style={{ color: palette.muted }}>
                <InlineEditableText value={invoice.labels.discount} onChange={labelUpdater("discount")} />
                {invoice.totals.discountType === "percent" ? ` (${invoice.totals.discountValue}%)` : ""}
              </span>
              <span className="text-right text-sm font-medium">-{formatCurrency(totals.discount, currency)}</span>
            </>
          ) : null}

          {invoice.totals.shippingEnabled ? (
            <>
              <span className="text-right text-sm" style={{ color: palette.muted }}>
                <InlineEditableText value={invoice.labels.shipping} onChange={labelUpdater("shipping")} />
              </span>
              <span className="text-right text-sm font-medium">{formatCurrency(totals.shipping, currency)}</span>
            </>
          ) : null}

          <span
            className="mt-1 pt-2 text-right font-bold"
            style={{ borderTop: `2px solid ${palette.border}`, color: palette.foreground }}
          >
            <InlineEditableText value={invoice.labels.total} onChange={labelUpdater("total")} />
          </span>
          <span
            className="mt-1 pt-2 text-right font-bold"
            style={{ borderTop: `2px solid ${palette.border}` }}
          >
            {formatCurrency(totals.total, currency)}
          </span>

          {totals.amountPaid > 0 ? (
            <>
              <span className="text-right text-sm" style={{ color: palette.muted }}>
                <InlineEditableText value={invoice.labels.amountPaid} onChange={labelUpdater("amountPaid")} />
              </span>
              <span className="text-right text-sm font-medium">-{formatCurrency(totals.amountPaid, currency)}</span>

              <span className="text-right text-lg font-bold">
                <InlineEditableText value={invoice.labels.amountDue} onChange={labelUpdater("amountDue")} />
              </span>
              <span className="text-right text-lg font-bold">{formatCurrency(totals.amountDue, currency)}</span>
            </>
          ) : null}
        </div>
      </div>

      {(hasNotes || canEdit) && (
        <div className="mt-8 space-y-2">
          <p className="text-sm font-semibold" style={{ color: palette.muted }}>
            <InlineEditableText value={invoice.labels.notes} onChange={labelUpdater("notes")} />
          </p>
          <p className="whitespace-pre-line" style={{ color: palette.foreground }}>
            <InlineEditableText
              value={invoice.notes}
              placeholder="-"
              multiline
              onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, notes: value })) : undefined}
              className="whitespace-pre-line"
            />
          </p>
        </div>
      )}

      {(hasTerms || canEdit) && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold" style={{ color: palette.muted }}>
            <InlineEditableText value={invoice.labels.terms} onChange={labelUpdater("terms")} />
          </p>
          <p className="whitespace-pre-line" style={{ color: palette.foreground }}>
            <InlineEditableText
              value={invoice.terms}
              placeholder="-"
              multiline
              onChange={canEdit ? (value) => onUpdate?.((d) => ({ ...d, terms: value })) : undefined}
              className="whitespace-pre-line"
            />
          </p>
        </div>
      )}
    </div>
  );
};

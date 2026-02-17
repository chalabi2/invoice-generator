import * as React from "react";
import { nanoid } from "nanoid";
import { Link2Off, Upload } from "lucide-react";

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
  ColorField,
  DatePickerField,
  EditableLabel,
  Field,
} from "@/features/invoice/components/EditorFields";
import { InvoicePreview } from "@/features/invoice/components/InvoicePreview";
import { InvoiceShell } from "@/features/invoice/components/InvoiceShell";
import { exportToPdf } from "@/features/invoice/lib/exportToPdf";
import {
  currencyOptions,
  defaultLabels,
  fontOptions,
  templateOptions,
} from "@/features/invoice/state/invoiceState";
import type {
  ExportState,
  InvoiceLabels,
  ThemeOption,
} from "@/features/invoice/types";
import { useInvoiceStore } from "@/features/invoice/hooks/useInvoiceStore";
import {
  abbreviateFileName,
  formatCurrency,
  getTotals,
  normalizeLogoValue,
  resolveLogoSource,
  validateNumber,
} from "@/features/invoice/lib/utils";

export function InvoiceEditorPage() {
  const { store, setStore, activeInvoice, invoiceTheme, updateInvoice } =
    useInvoiceStore();

  const [exportState, setExportState] = React.useState<ExportState>({
    isExporting: false,
    status: "",
    error: null,
  });

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

  const onExport = () =>
    exportToPdf(activeInvoice, "invoice-export", setExportState);

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
      isExporting={exportState.isExporting}
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
                    onLabelChange={(value) => updateLabel("invoiceNumber", value)}
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
                    onLabelChange={(value) => updateLabel("paymentTerms", value)}
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
                            <p className="text-sm font-semibold">Item {index + 1}</p>
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
                                onChange={(value) => updateLabel("description", value)}
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
                                onChange={(value) => updateLabel("quantity", value)}
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
                        {formatCurrency(totals.total, activeInvoice.preferences.currency)}
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
                            template: value as "modern" | "classic" | "minimal",
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOptions.map((template) => (
                          <SelectItem key={template.value} value={template.value}>
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

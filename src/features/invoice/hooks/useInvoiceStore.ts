import * as React from "react";

import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  createEmptyInvoice,
  createInitialStore,
  defaultLabels,
  fontOptions,
  STORAGE_KEY,
} from "@/features/invoice/state/invoiceState";
import type {
  InvoiceData,
  StoreState,
  TemplateOption,
  ThemeOption,
} from "@/features/invoice/types";

export const useInvoiceStore = () => {
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

  const addInvoice = (folderId?: string | null) => {
    const fresh = createEmptyInvoice();
    const stored = {
      id: fresh.id,
      clientName: fresh.client.name,
      invoiceNumber: fresh.meta.invoiceNumber,
      updatedAt: fresh.updatedAt,
      folderId: folderId ?? null,
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

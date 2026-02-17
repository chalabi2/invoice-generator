import * as React from "react";

import { InvoicePreview } from "@/features/invoice/components/InvoicePreview";
import { InvoiceShell } from "@/features/invoice/components/InvoiceShell";
import { useInvoiceStore } from "@/features/invoice/hooks/useInvoiceStore";
import { exportToPdf } from "@/features/invoice/lib/exportToPdf";
import type { ExportState } from "@/features/invoice/types";

export function InvoicePreviewPage() {
  const { store, setStore, activeInvoice, invoiceTheme, updateInvoice } =
    useInvoiceStore();

  const [exportState, setExportState] = React.useState<ExportState>({
    isExporting: false,
    status: "",
    error: null,
  });

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

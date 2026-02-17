import * as React from "react";

import { exportInvoiceToPdf } from "@/lib/pdf-service";
import type { ExportState, InvoiceData } from "@/features/invoice/types";

export const exportToPdf = async (
  invoice: InvoiceData,
  elementId: string,
  setExportState: React.Dispatch<React.SetStateAction<ExportState>>
) => {
  setExportState({
    isExporting: true,
    status: "Preparing export...",
    error: null,
  });

  try {
    const result = await exportInvoiceToPdf(invoice, elementId, {
      filename: `invoice-${invoice.meta.invoiceNumber || invoice.id}.pdf`,
      onProgress: (status) => {
        setExportState((prev) => ({ ...prev, status }));
      },
    });

    if (result.success) {
      setExportState({ isExporting: false, status: "PDF saved", error: null });
    } else {
      setExportState({
        isExporting: false,
        status: "",
        error: result.error || "Failed to generate PDF",
      });
    }
  } catch (error) {
    setExportState({
      isExporting: false,
      status: "",
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    });
  }
};

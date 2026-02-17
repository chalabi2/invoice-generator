import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoicePreview } from "@/features/invoice/components/InvoicePreview";
import { InvoiceShell } from "@/features/invoice/components/InvoiceShell";
import { useInvoiceStore } from "@/features/invoice/hooks/useInvoiceStore";
import { exportToPdf } from "@/features/invoice/lib/exportToPdf";
import { formatTimestamp } from "@/features/invoice/lib/utils";
import { cn } from "@/lib/utils";
import type { ExportState, InvoiceFolder } from "@/features/invoice/types";

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
    null,
  );

  const [exportState, setExportState] = React.useState<ExportState>({
    isExporting: false,
    status: "",
    error: null,
  });

  const onExport = () =>
    exportToPdf(activeInvoice, "invoice-export", setExportState);

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
        (folder) => folder.id !== folderId,
      ),
      invoices: current.invoices.map((invoice) =>
        invoice.folderId === folderId
          ? { ...invoice, folderId: null }
          : invoice,
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
        invoice.id === invoiceId ? { ...invoice, folderId } : invoice,
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
      isExporting={exportState.isExporting}
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
              <strong>browser storage</strong> and are{" "}
              <strong>not shared</strong> with anyone or{" "}
              <strong>stored on a server</strong>. If you{" "}
              <strong>clear your browser history</strong>, your invoices will be{" "}
              <strong>deleted</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        "ring-2 ring-[hsl(var(--primary))]",
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
                        "ring-2 ring-[hsl(var(--primary))]",
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
                            "ring-2 ring-[hsl(var(--primary))]",
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
                          isActive && "bg-[hsl(var(--muted))]",
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
                            disabled={exportState.isExporting}
                            onClick={() => {
                              setActiveInvoice(invoice.id);
                              exportToPdf(
                                invoice.data,
                                "invoice-export",
                                setExportState,
                              );
                            }}
                          >
                            {exportState.isExporting ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Exporting...
                              </>
                            ) : (
                              "Export PDF"
                            )}
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
                  <Button
                    variant="secondary"
                    onClick={() =>
                      addInvoice(
                        selectedFolderId !== "all" && selectedFolderId !== "unfiled"
                          ? selectedFolderId
                          : null
                      )
                    }
                    className="w-full"
                  >
                    New invoice
                  </Button>
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

import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Link2Off, Loader2, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import type { InvoiceData, StoreState } from "@/features/invoice/types";

export const InvoiceShell = ({
  children,
  store,
  setStore,
  onExport,
  exportTargetId,
  exportPreview,
  activeInvoice,
  isExporting = false,
}: {
  children: React.ReactNode;
  store: StoreState;
  setStore: React.Dispatch<React.SetStateAction<StoreState>>;
  onExport: () => void;
  exportTargetId: string;
  exportPreview: React.ReactNode;
  activeInvoice: InvoiceData;
  isExporting?: boolean;
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Export PDF"
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExporting ? "Generating PDF..." : "Export as PDF"}
                </TooltipContent>
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
            <DialogTitle>
              Support this project{" "}
              <span className="ml-4 text-xs text-[hsl(var(--muted-foreground))]">
                last updated: 2026-02-13
              </span>
            </DialogTitle>
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
                I have also made this project source code available on github
                with a BSL 1.1 license. You can find the source code{" "}
                <a
                  href="https://github.com/chalabi2/invoice-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                .
              </p>
              <p>
                Any donations would be very helpful. Currently, the domain is
                $1.20 per month, the frontend is hosted on cloudflare pages and
                is currently free, the pdf generation is also a cloudflare
                worker and its cost is directly proportional to the number of
                requests. If usage increases, costs will go up as well. Thank
                you!
              </p>
            </DialogDescription>
            <div className="mt-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3 text-left text-sm">
              Wallet: <span className="font-mono">0xc17510C86bE51FB1ba32FbD6ab2bD7a83A4A89dE</span>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router"

import { InvoiceEditorPage, InvoiceLibraryPage, InvoicePreviewPage } from "@/routes/InvoicePage"

function RootLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: InvoiceLibraryPage,
})

const previewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview",
  component: InvoicePreviewPage,
})

const editRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/edit",
  component: InvoiceEditorPage,
})

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/library",
  component: InvoiceLibraryPage,
})

const routeTree = rootRoute.addChildren([indexRoute, previewRoute, libraryRoute, editRoute])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

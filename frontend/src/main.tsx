import React, { Suspense, lazy } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster, toast } from "sonner"
import { SessionProvider } from "./lib/session"
import Layout from "./components/Layout"
import { Empty, Loading } from "./components/ui"
import Home from "./pages/Home"
import "./styles.css"

const Explore = lazy(() => import("./pages/Explore"))
const Product = lazy(() => import("./pages/Product"))
const Cart = lazy(() => import("./pages/Cart"))
const Orders = lazy(() => import("./pages/Orders"))
const Seller = lazy(() => import("./pages/Seller"))
const Account = lazy(() => import("./pages/Account"))
const Sell = lazy(() => import("./pages/Sell"))
const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onError: (error) => toast.error(error.message) }),
  defaultOptions: { queries: { staleTime: 20000, retry: 1 }, mutations: { retry: false } },
})
class AppBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <Empty
        title="Algo saiu da órbita."
        description="Recarregue a página para tentar novamente."
        action={
          <button className="button" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        }
      />
    ) : (
      this.props.children
    )
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SessionProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="explorar" element={<Explore />} />
                  <Route path="produto/:id" element={<Product />} />
                  <Route path="carrinho" element={<Cart />} />
                  <Route path="compras" element={<Orders />} />
                  <Route path="painel/*" element={<Seller />} />
                  <Route path="conta" element={<Account />} />
                  <Route path="vender" element={<Sell />} />
                  <Route
                    path="*"
                    element={
                      <Empty
                        title="Esse caminho ainda não existe."
                        description="Volte ao início para continuar explorando."
                        action={
                          <a className="button" href="/">
                            Voltar ao início
                          </a>
                        }
                      />
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
            <Toaster richColors position="bottom-right" closeButton />
          </SessionProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppBoundary>
  </React.StrictMode>,
)

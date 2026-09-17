import { createContext, useContext, useState, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api, definirConta } from "./api"
import type { Sessao } from "../types"

const SessionContext = createContext<{
  session: Sessao
  loading: boolean
  error: boolean
  authOpen: boolean
  setAuthOpen: (v: boolean) => void
  sync: () => Promise<Sessao>
  switchAccount: (id: string) => Promise<Sessao>
  removeAccount: (id: string) => Promise<Sessao>
  logout: () => Promise<Sessao>
}>(null!)
async function fetchSession() {
  const session = await api<Sessao>("/sessao")
  definirConta(session.conta?.id ?? null)
  return session
}
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [authOpen, setAuthOpen] = useState(false)
  const query = useQuery({
    queryKey: ["sessao"],
    queryFn: fetchSession,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    retry: 1,
  })
  async function sync() {
    await queryClient.cancelQueries()
    const session = await fetchSession()
    queryClient.setQueryData(["sessao"], session)
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === "privado" })
    await queryClient.invalidateQueries({ queryKey: ["produtos"] })
    return session
  }
  async function switchAccount(id: string) {
    await api("/sessao/trocar", { method: "POST", body: JSON.stringify({ contaId: id }) })
    return sync()
  }
  async function removeAccount(id: string) {
    await api(`/sessao/perfis/${id}`, { method: "DELETE" })
    return sync()
  }
  async function logout() {
    await api("/sessao", { method: "DELETE" })
    return sync()
  }
  return (
    <SessionContext.Provider
      value={{
        session: query.data ?? { conta: null, perfis: [] },
        loading: query.isPending,
        error: query.isError,
        authOpen,
        setAuthOpen,
        sync,
        switchAccount,
        removeAccount,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
export const useSession = () => useContext(SessionContext)
export function useCart() {
  const { session } = useSession()
  return useQuery({
    queryKey: ["privado", session.conta?.id, "carrinho"],
    queryFn: () => api<import("../types").Carrinho>("/comprador/carrinho"),
    enabled: session.conta?.papel === "COMPRADOR",
  })
}

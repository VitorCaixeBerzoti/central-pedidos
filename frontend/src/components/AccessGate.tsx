import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useSession } from "../lib/session"
import type { Papel } from "../types"
import { Button, Empty, ErrorState, Loading } from "./ui"
export function AccessGate({ role, children }: { role?: Papel; children: ReactNode }) {
  const { session, loading, error, setAuthOpen, sync } = useSession()
  if (loading) return <Loading />
  if (error)
    return (
      <ErrorState
        retry={() => {
          void sync()
        }}
      />
    )
  if (!session.conta)
    return (
      <Empty
        title="Entre no seu universo."
        description="Conecte sua conta para continuar. Seus pedidos e seu carrinho ficam guardados para você."
        action={<Button onClick={() => setAuthOpen(true)}>Entrar ou criar conta</Button>}
      />
    )
  if (role && session.conta.papel !== role)
    return (
      <Empty
        title={`Este espaço é para ${role === "COMPRADOR" ? "compradores" : "vendedores"}.`}
        description="Troque de perfil pelo menu no topo ou conecte outra conta."
        action={
          <>
            <Button onClick={() => setAuthOpen(true)}>Conectar outra conta</Button>
            <Link className="text-link" to="/">
              Voltar ao início
            </Link>
          </>
        }
      />
    )
  return children
}

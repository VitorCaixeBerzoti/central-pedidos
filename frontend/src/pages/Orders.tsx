import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { api, date, money } from "../lib/api"
import { useSession } from "../lib/session"
import type { Compra } from "../types"
import { AccessGate } from "../components/AccessGate"
import { Empty, ErrorState, Loading } from "../components/ui"
import { OrderCard } from "../components/OrderCard"

export default function Orders() {
  return (
    <AccessGate role="COMPRADOR">
      <OrdersContent />
    </AccessGate>
  )
}
function OrdersContent() {
  const { session } = useSession()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const orders = useQuery({
    queryKey: ["privado", session.conta?.id, "compras"],
    queryFn: () => api<Compra[]>("/comprador/compras"),
    refetchInterval: 30000,
  })
  const cancel = useMutation({
    mutationFn: (id: number) => api(`/comprador/pedidos/${id}/cancelar`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries()
      toast.success("Pedido cancelado. Estorno simulado registrado.")
    },
  })
  return (
    <div className="container page orders-page">
      <div className="breadcrumb">
        <Link to="/">Início</Link>
        <span>/</span>
        <span>Minhas compras</span>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CADA DESCOBERTA, UM NOVO CAMINHO</span>
          <h1>Minhas compras.</h1>
          <p>Acompanhe os pedidos de cada loja em um só lugar.</p>
        </div>
        <Link className="button secondary" to="/explorar">
          Continuar explorando
          <ArrowRight size={17} />
        </Link>
      </div>
      {params.get("nova") && (
        <div className="success-banner">
          <CheckCircle2 size={28} />
          <div>
            <h2>Seus achados já estão na sua órbita!</h2>
            <p>Pagamento simulado aprovado. Cada loja recebeu seu pedido.</p>
          </div>
        </div>
      )}
      {orders.isPending ? (
        <Loading />
      ) : orders.isError ? (
        <ErrorState retry={() => orders.refetch()} />
      ) : !orders.data.length ? (
        <Empty
          title="Sua primeira descoberta começa aqui."
          description="Quando você finalizar uma compra, os pedidos aparecerão neste espaço."
          action={
            <Link className="button" to="/explorar">
              Explorar produtos
            </Link>
          }
        />
      ) : (
        <div className="purchases">
          {orders.data.map((compra) => (
            <section className="purchase" key={compra.id}>
              <div className="purchase-heading">
                <span>
                  Compra de {date(compra.criadoEm)}
                  <small>
                    {compra.pedidos.length} {compra.pedidos.length === 1 ? "loja" : "lojas"} ·{" "}
                    {compra.pagamento === "ESTORNADO"
                      ? "Estorno total simulado"
                      : compra.pagamento === "ESTORNADO_PARCIAL"
                        ? "Estorno parcial simulado"
                        : "Pagamento simulado aprovado"}
                  </small>
                </span>
                <strong>{money(compra.totalCentavos)}</strong>
              </div>
              {compra.pedidos.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  pending={cancel.isPending}
                  change={(id) => cancel.mutate(id)}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

import { useParams, Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Check, Minus, Plus, ShoppingBag, Store, Truck } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { api, money } from "../lib/api"
import { useCart, useSession } from "../lib/session"
import type { Produto } from "../types"
import { Button, ErrorState, Loading } from "../components/ui"

export default function Product() {
  const { id } = useParams()
  const product = useQuery({
    queryKey: ["produtos", id],
    queryFn: () => api<Produto>(`/produtos/${id}`),
  })
  const [quantity, setQuantity] = useState(1)
  const { session, setAuthOpen } = useSession()
  const cart = useCart()
  const queryClient = useQueryClient()
  const add = useMutation({
    mutationFn: () => {
      const atual =
        cart.data?.grupos.flatMap((g) => g.itens).find((i) => i.produtoId === id)?.quantidade ?? 0
      return api(`/comprador/carrinho/${id}`, {
        method: "PUT",
        body: JSON.stringify({ quantidade: atual + quantity }),
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["privado", session.conta?.id, "carrinho"] })
      toast.success("Seu achado está no carrinho!")
    },
  })
  if (product.isPending) return <Loading />
  if (product.isError) return <ErrorState retry={() => product.refetch()} />
  const p = product.data
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">Início</Link>
        <span>/</span>
        <Link to={`/explorar?categoria=${p.categoriaId}`}>{p.categoria.nome}</Link>
        <span>/</span>
        <span>{p.nome}</span>
      </div>
      <div className="product-detail">
        <div className="detail-photo">
          <img src={p.imagem} alt={p.nome} width="1000" height="1000" />
          {p.destaque && <span className="product-tag">Seleção Órbita</span>}
        </div>
        <div className="detail-info">
          <span className="eyebrow">{p.categoria.nome}</span>
          <h1>{p.nome}</h1>
          <Link className="seller-link" to={`/explorar?loja=${p.empresaId}`}>
            <Store size={17} /> Vendido por <strong>{p.empresa.nome}</strong>
            <ArrowRight size={15} />
          </Link>
          <div className="detail-price">{money(p.precoCentavos)}</div>
          <p className="muted">Pagamento simulado aprovado automaticamente no checkout.</p>
          <div className="detail-description">
            <p>{p.descricao}</p>
          </div>
          <div className="stock-info">
            <span className={p.estoque ? "live-dot" : "sold-out-dot"} />
            {p.estoque ? `${p.estoque} unidades disponíveis` : "Temporariamente esgotado"}
          </div>
          <div className="purchase-controls">
            <div className="quantity-control">
              <button
                aria-label="Diminuir quantidade"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={15} />
              </button>
              <span aria-label="Quantidade">{quantity}</span>
              <button
                aria-label="Aumentar quantidade"
                disabled={quantity >= Math.min(p.estoque, 99)}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={15} />
              </button>
            </div>
            <Button
              busy={add.isPending}
              disabled={!p.estoque || (session.conta?.papel === "COMPRADOR" && cart.isPending)}
              onClick={() =>
                session.conta?.papel === "COMPRADOR" ? add.mutate() : setAuthOpen(true)
              }
            >
              <ShoppingBag size={18} />
              {session.conta?.papel === "VENDEDOR"
                ? "Entrar como comprador"
                : "Adicionar ao carrinho"}
            </Button>
          </div>
          {add.isSuccess && (
            <Link className="text-link added-cart" to="/carrinho">
              <Check size={17} /> Ver meu carrinho
              <ArrowRight size={17} />
            </Link>
          )}
          <div className="delivery-box">
            <Truck size={23} />
            <div>
              <strong>Frete fixo de R$ 15,00 nesta loja</strong>
              <p>Mais produtos do mesmo vendedor, um único frete.</p>
            </div>
          </div>
          <p className="demo-note">Compra demonstrativa. Não há cobrança ou envio real.</p>
        </div>
      </div>
    </div>
  )
}

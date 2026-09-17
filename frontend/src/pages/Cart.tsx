import { useState, useRef, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  MapPin,
  Minus,
  Plus,
  Store,
  Trash2,
  Truck,
} from "lucide-react"
import { api, money } from "../lib/api"
import { useCart, useSession } from "../lib/session"
import { AccessGate } from "../components/AccessGate"
import { Button, Empty, ErrorState, Loading } from "../components/ui"

export default function Cart() {
  return (
    <AccessGate role="COMPRADOR">
      <CartContent />
    </AccessGate>
  )
}
function CartContent() {
  const { session } = useSession()
  const cart = useCart()
  const [checkout, setCheckout] = useState(false)
  const chave = useRef(crypto.randomUUID())
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const update = useMutation({
    mutationFn: ({ id, quantidade }: { id: string; quantidade: number }) =>
      api(`/comprador/carrinho/${id}`, { method: "PUT", body: JSON.stringify({ quantidade }) }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["privado", session.conta?.id, "carrinho"] }),
  })
  const pay = useMutation({
    mutationFn: (endereco: Record<string, FormDataEntryValue>) =>
      api<{ compraId: string }>("/comprador/checkout", {
        method: "POST",
        body: JSON.stringify({ endereco, chave: chave.current, cotacao: cart.data?.cotacao }),
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries()
      navigate(`/compras?nova=${data.compraId}`)
    },
    onError: () => {
      void cart.refetch()
    },
  })
  if (cart.isPending) return <Loading />
  if (cart.isError) return <ErrorState retry={() => cart.refetch()} />
  const data = cart.data
  if (!data?.quantidade)
    return (
      <Empty
        title="Seu próximo achado está esperando."
        description="Seu carrinho está vazio. Explore o catálogo e encontre algo que combine com você."
        action={
          <Link className="button" to="/explorar">
            Começar a explorar
            <ArrowRight size={18} />
          </Link>
        }
      />
    )
  const unavailable = data.grupos.some((g) =>
    g.itens.some((i) => !i.produto.ativo || i.quantidade > i.produto.estoque),
  )
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    pay.mutate(Object.fromEntries(new FormData(e.currentTarget)))
  }
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">Início</Link>
        <span>/</span>
        <span>Carrinho</span>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">QUASE NA SUA ÓRBITA</span>
          <h1>{checkout ? "Para onde vão seus achados?" : "Seu carrinho."}</h1>
          <p>
            {data.quantidade} itens, {data.grupos.length}{" "}
            {data.grupos.length === 1 ? "loja" : "lojas"}. Uma nova descoberta a caminho.
          </p>
        </div>
        <div className="checkout-steps">
          <span className={!checkout ? "current" : "complete"}>
            {checkout ? <Check size={13} /> : "1"}
          </span>{" "}
          Carrinho <i />
          <span className={checkout ? "current" : ""}>2</span> Entrega
        </div>
      </div>
      <div className="cart-layout">
        <section className="cart-main">
          {checkout ? (
            <>
              <button className="text-link back-link" onClick={() => setCheckout(false)}>
                <ArrowLeft size={17} /> Voltar ao carrinho
              </button>
              <form
                id="checkout-form"
                className="surface address-form form-stack"
                onSubmit={submit}
              >
                <h2>
                  <MapPin size={21} /> Endereço de entrega
                </h2>
                <p className="muted">
                  Use dados fictícios nesta demonstração. Nenhuma encomenda será enviada.
                </p>
                <label>
                  Nome de quem recebe
                  <input
                    name="destinatario"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue={session.conta?.nome}
                  />
                </label>
                <div className="form-grid">
                  <label>
                    CEP
                    <input
                      name="cep"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9]{5}-?[0-9]{3}"
                      required
                      placeholder="00000-000"
                    />
                  </label>
                  <label>
                    Número
                    <input
                      name="numero"
                      autoComplete="off"
                      required
                      maxLength={20}
                      placeholder="123"
                    />
                  </label>
                </div>
                <label>
                  Rua ou avenida
                  <input
                    name="rua"
                    autoComplete="address-line1"
                    required
                    minLength={3}
                    maxLength={150}
                  />
                </label>
                <label>
                  Complemento <span className="optional">(opcional)</span>
                  <input name="complemento" autoComplete="address-line2" maxLength={100} />
                </label>
                <div className="form-grid">
                  <label>
                    Cidade
                    <input
                      name="cidade"
                      autoComplete="address-level2"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Estado
                    <select name="estado" autoComplete="address-level1" required defaultValue="">
                      <option value="" disabled>
                        Selecione
                      </option>
                      {[
                        "AC",
                        "AL",
                        "AP",
                        "AM",
                        "BA",
                        "CE",
                        "DF",
                        "ES",
                        "GO",
                        "MA",
                        "MT",
                        "MS",
                        "MG",
                        "PA",
                        "PB",
                        "PR",
                        "PE",
                        "PI",
                        "RJ",
                        "RN",
                        "RS",
                        "RO",
                        "RR",
                        "SC",
                        "SP",
                        "SE",
                        "TO",
                      ].map((uf) => (
                        <option key={uf}>{uf}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </form>
              <div className="payment-demo">
                <LockKeyhole size={22} />
                <div>
                  <strong>Pagamento de demonstração</strong>
                  <p>
                    A aprovação é automática. Você não precisa informar cartão ou dados bancários.
                  </p>
                </div>
              </div>
            </>
          ) : (
            data.grupos.map((grupo) => (
              <article className="cart-group surface" key={grupo.loja.id}>
                <div className="cart-group-heading">
                  <span>
                    <Store size={19} />
                    <strong>{grupo.loja.nome}</strong>
                  </span>
                  <span>Pedido separado</span>
                </div>
                {grupo.itens.map((item) => (
                  <div className="cart-item" key={item.produtoId}>
                    <Link to={`/produto/${item.produtoId}`} className="cart-item-image">
                      <img
                        src={item.produto.imagem}
                        alt={item.produto.nome}
                        width="100"
                        height="100"
                      />
                    </Link>
                    <div className="cart-item-info">
                      <span>{item.produto.categoria.nome}</span>
                      <Link to={`/produto/${item.produtoId}`}>
                        <h3>{item.produto.nome}</h3>
                      </Link>
                      <p>{money(item.produto.precoCentavos)} por unidade</p>
                      {(!item.produto.ativo || item.quantidade > item.produto.estoque) && (
                        <p className="form-error">
                          Indisponível nesta quantidade. Ajuste ou remova.
                        </p>
                      )}
                      <div className="quantity-control">
                        <button
                          disabled={update.isPending || item.quantidade <= 1 || pay.isPending}
                          aria-label={`Diminuir ${item.produto.nome}`}
                          onClick={() =>
                            update.mutate({ id: item.produtoId, quantidade: item.quantidade - 1 })
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantidade}</span>
                        <button
                          disabled={
                            update.isPending ||
                            item.quantidade >= Math.min(item.produto.estoque, 99) ||
                            pay.isPending
                          }
                          aria-label={`Aumentar ${item.produto.nome}`}
                          onClick={() =>
                            update.mutate({ id: item.produtoId, quantidade: item.quantidade + 1 })
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-end">
                      <strong>{money(item.quantidade * item.produto.precoCentavos)}</strong>
                      <button
                        className="icon-button"
                        aria-label={`Remover ${item.produto.nome}`}
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: item.produtoId, quantidade: 0 })}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="cart-group-footer">
                  <span>
                    <Truck size={17} /> Frete desta loja
                  </span>
                  <strong>{money(grupo.freteCentavos)}</strong>
                </div>
              </article>
            ))
          )}
        </section>
        <aside className="order-summary surface">
          <span className="eyebrow">TUDO À VISTA</span>
          <h2>Resumo da compra</h2>
          <div className="summary-row">
            <span>Produtos ({data.quantidade})</span>
            <strong>{money(data.subtotalCentavos)}</strong>
          </div>
          {data.grupos.map((g) => (
            <div className="summary-row" key={g.loja.id}>
              <span>Frete · {g.loja.nome}</span>
              <span>{money(g.freteCentavos)}</span>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(data.totalCentavos)}</strong>
          </div>
          {unavailable && (
            <p className="form-error" role="alert">
              Ajuste os itens indisponíveis para continuar.
            </p>
          )}
          {pay.isError && (
            <p className="form-error" role="alert">
              {pay.error.message}
            </p>
          )}
          {checkout ? (
            <Button
              className="full"
              type="submit"
              form="checkout-form"
              busy={pay.isPending}
              disabled={unavailable}
            >
              Finalizar compra simulada
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button
              className="full"
              disabled={unavailable || update.isPending}
              onClick={() => {
                setCheckout(true)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
            >
              Continuar para entrega
              <ArrowRight size={18} />
            </Button>
          )}
          <p className="summary-note">
            <LockKeyhole size={14} /> Nenhuma cobrança real será realizada.
          </p>
          <Link className="text-link" to="/explorar">
            Continuar explorando
          </Link>
        </aside>
      </div>
    </div>
  )
}

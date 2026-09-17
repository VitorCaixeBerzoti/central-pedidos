import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  ImagePlus,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Settings2,
  Store,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"
import { api, money } from "../lib/api"
import { useSession } from "../lib/session"
import type { Categoria, Pedido, Produto, Resumo, Status } from "../types"
import { AccessGate } from "../components/AccessGate"
import { Button, Empty, ErrorState, Loading, Modal, statusLabels } from "../components/ui"
import { OrderCard } from "../components/OrderCard"

export default function Seller() {
  return (
    <AccessGate role="VENDEDOR">
      <SellerContent />
    </AccessGate>
  )
}
function SellerContent() {
  const { session, sync } = useSession()
  const [params, setParams] = useSearchParams()
  const tab = params.get("aba") ?? "visao-geral"
  const [editing, setEditing] = useState<Produto | "novo" | null>(null)
  const [filter, setFilter] = useState("todos")
  const queryClient = useQueryClient()
  const prefix = ["privado", session.conta!.id, "vendedor"]
  const overview = useQuery({
    queryKey: [...prefix, "resumo"],
    queryFn: () => api<Resumo>("/vendedor/resumo"),
  })
  const products = useQuery({
    queryKey: [...prefix, "produtos"],
    queryFn: () => api<Produto[]>("/vendedor/produtos"),
  })
  const orders = useQuery({
    queryKey: [...prefix, "pedidos"],
    queryFn: () => api<Pedido[]>("/vendedor/pedidos"),
    refetchInterval: 30000,
  })
  const change = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Status }) =>
      api(`/vendedor/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      void queryClient.invalidateQueries()
      toast.success("Pedido atualizado.")
    },
  })
  const store = useMutation({
    mutationFn: (dados: Record<string, FormDataEntryValue>) =>
      api("/vendedor/loja", { method: "PATCH", body: JSON.stringify(dados) }),
    onSuccess: async () => {
      await sync()
      toast.success("Sua loja está atualizada.")
    },
  })
  function updateStore(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    store.mutate(Object.fromEntries(new FormData(e.currentTarget)))
  }
  const stats = overview.data
  return (
    <div className="container page seller-page">
      <div className="seller-heading">
        <div>
          <span className="eyebrow">
            <span className="live-dot" /> SEU ESPAÇO PARA CRESCER
          </span>
          <h1>
            {session.conta!.empresa!.nome}
            <span className="lime-dot">.</span>
          </h1>
          <p>As próximas descobertas começam com você.</p>
        </div>
        <Link className="button secondary" to={`/explorar?loja=${session.conta!.empresaId}`}>
          Ver minha vitrine
          <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="seller-tabs" role="navigation" aria-label="Painel do vendedor">
        {[
          { id: "visao-geral", label: "Visão geral", Icon: LayoutDashboard },
          { id: "produtos", label: "Meus produtos", Icon: Boxes },
          { id: "pedidos", label: "Pedidos", Icon: Package },
          { id: "loja", label: "Minha loja", Icon: Settings2 },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            className={tab === id ? "selected" : ""}
            onClick={() => setParams({ aba: id })}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
      {tab === "visao-geral" && (
        <>
          {overview.isPending ? (
            <Loading />
          ) : overview.isError ? (
            <ErrorState retry={() => overview.refetch()} />
          ) : (
            <>
              <div className="stats-grid">
                <Stat
                  title="Vendas simuladas"
                  value={money(stats!.vendasCentavos)}
                  Icon={CircleDollarSign}
                  note="Pedidos não cancelados, com frete"
                  primary
                />
                <Stat
                  title="Pedidos recebidos"
                  value={String(stats!.pedidos)}
                  Icon={Package}
                  note={`${stats!.preparar} aguardando preparo ou envio`}
                />
                <Stat
                  title="Anúncios ativos"
                  value={String(stats!.produtos)}
                  Icon={Boxes}
                  note="Produtos na sua vitrine"
                />
                <Stat
                  title="Estoque baixo"
                  value={String(stats!.estoqueBaixo)}
                  Icon={TriangleAlert}
                  note="Produtos com até 5 unidades"
                />
              </div>
              <div className="dashboard-lower">
                <section className="surface dashboard-status">
                  <div className="section-heading compact">
                    <div>
                      <h2>O ritmo da sua loja</h2>
                      <p>Pedidos por etapa</p>
                    </div>
                    <ChartNoAxesCombined size={22} />
                  </div>
                  {(Object.keys(statusLabels) as Status[]).map((status) => {
                    const n = stats!.porStatus.find((g) => g.status === status)?.quantidade ?? 0
                    return (
                      <div className="status-bar-row" key={status}>
                        <span>{statusLabels[status]}</span>
                        <div className="status-bar-track">
                          <span
                            style={{
                              width: `${stats!.pedidos ? Math.max(2, (n / stats!.pedidos) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <strong>{n}</strong>
                      </div>
                    )
                  })}
                </section>
                <section className="dashboard-tip">
                  <span className="eyebrow">PRÓXIMO PASSO</span>
                  <TrendingUp size={34} />
                  <h2>
                    Mais achados.
                    <br />
                    Mais possibilidades.
                  </h2>
                  <p>
                    Uma boa foto e uma descrição clara ajudam seus produtos a encontrar novas
                    órbitas.
                  </p>
                  <Button onClick={() => setEditing("novo")}>
                    Publicar um produto
                    <Plus size={18} />
                  </Button>
                </section>
              </div>
            </>
          )}
          <div className="section-heading">
            <h2>Pedidos mais recentes</h2>
            <button className="text-link" onClick={() => setParams({ aba: "pedidos" })}>
              Ver todos
              <ArrowUpRight size={17} />
            </button>
          </div>
          {orders.isPending ? (
            <Loading />
          ) : orders.isError ? (
            <ErrorState retry={() => orders.refetch()} />
          ) : !orders.data.length ? (
            <Empty
              title="Sua loja está pronta para receber pedidos."
              description="Compartilhe sua vitrine ou faça uma compra de demonstração com uma conta compradora."
            />
          ) : (
            orders.data
              .slice(0, 3)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  seller
                  pending={change.isPending}
                  change={(id, status) => change.mutate({ id, status })}
                />
              ))
          )}
        </>
      )}
      {tab === "produtos" && (
        <>
          <div className="section-heading">
            <div>
              <h2>Seus produtos</h2>
              <p>{products.data?.length ?? 0} anúncios na sua loja</p>
            </div>
            <Button onClick={() => setEditing("novo")}>
              <Plus size={18} /> Novo produto
            </Button>
          </div>
          {products.isPending ? (
            <Loading />
          ) : products.isError ? (
            <ErrorState retry={() => products.refetch()} />
          ) : !products.data.length ? (
            <Empty
              title="Sua vitrine começa com um produto."
              description="Adicione uma foto, conte a história do produto e defina preço e estoque."
              action={<Button onClick={() => setEditing("novo")}>Publicar primeiro produto</Button>}
            />
          ) : (
            <div className="surface table-wrap">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Visibilidade</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.data.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-product">
                          <img src={p.imagem} alt="" width="56" height="56" />
                          <span>
                            <strong>{p.nome}</strong>
                            <small>{p.categoria.nome}</small>
                          </span>
                        </div>
                      </td>
                      <td>{money(p.precoCentavos)}</td>
                      <td>
                        <span className={p.estoque <= 5 ? "low-stock" : ""}>{p.estoque} un.</span>
                      </td>
                      <td>
                        <span className={`visibility ${p.ativo ? "visible" : ""}`}>
                          {p.ativo ? "Publicado" : "Pausado"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Editar ${p.nome}`}
                          onClick={() => setEditing(p)}
                        >
                          <Pencil size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {tab === "pedidos" && (
        <>
          <div className="section-heading">
            <div>
              <h2>Pedidos da sua loja</h2>
              <p>Acompanhe cada descoberta do pagamento à entrega.</p>
            </div>
            <label className="inline-select">
              Status
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="todos">Todos os pedidos</option>
                {Object.entries(statusLabels).map(([id, nome]) => (
                  <option value={id} key={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {orders.isPending ? (
            <Loading />
          ) : orders.isError ? (
            <ErrorState retry={() => orders.refetch()} />
          ) : orders.data.filter((o) => filter === "todos" || o.status === filter).length ? (
            orders.data
              .filter((o) => filter === "todos" || o.status === filter)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  seller
                  pending={change.isPending}
                  change={(id, status) => change.mutate({ id, status })}
                />
              ))
          ) : (
            <Empty
              title="Nenhum pedido por aqui ainda."
              description="Os pedidos recebidos aparecerão nesta lista."
            />
          )}
        </>
      )}
      {tab === "loja" && (
        <div className="settings-layout">
          <div>
            <span className="eyebrow">A SUA IDENTIDADE</span>
            <h2>Conte a história da sua loja.</h2>
            <p className="muted">Estas informações aparecem na sua vitrine.</p>
            <div className="delivery-box">
              <Store size={25} />
              <p>
                Frete fixo: <strong>R$ 15,00 por pedido da sua loja.</strong>
              </p>
            </div>
          </div>
          <form className="surface form-stack settings-form" onSubmit={updateStore}>
            <label>
              Nome da loja
              <input
                name="nome"
                minLength={2}
                maxLength={100}
                required
                defaultValue={session.conta!.empresa!.nome}
              />
            </label>
            <label>
              Sobre a loja
              <textarea
                name="descricao"
                rows={5}
                maxLength={500}
                defaultValue={session.conta!.empresa!.descricao}
              />
            </label>
            <Button type="submit" busy={store.isPending}>
              Salvar alterações
            </Button>
          </form>
        </div>
      )}
      <Modal
        wide
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "novo" ? "Um novo achado na sua loja" : "Editar produto"}
      >
        {editing && (
          <ProductForm
            product={editing === "novo" ? undefined : editing}
            saved={async () => {
              setEditing(null)
              await queryClient.invalidateQueries()
              toast.success("Produto salvo na sua loja.")
            }}
          />
        )}
      </Modal>
    </div>
  )
}
function Stat({
  title,
  value,
  Icon,
  note,
  primary,
}: {
  title: string
  value: string
  Icon: typeof Package
  note: string
  primary?: boolean
}) {
  return (
    <div className={`stat-card ${primary ? "stat-primary" : ""}`}>
      <div>
        <span>{title}</span>
        <Icon size={20} />
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}
function ProductForm({ product, saved }: { product?: Produto; saved: () => Promise<void> }) {
  const [image, setImage] = useState(product?.imagem ?? "")
  const { data: categories = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: () => api<Categoria[]>("/categorias"),
  })
  const upload = useMutation({
    mutationFn: (file: File) =>
      api<{ imagem: string }>("/vendedor/imagens", {
        method: "POST",
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      }),
    onSuccess: (result) => setImage(result.imagem),
  })
  const save = useMutation({
    mutationFn: (dados: Record<string, unknown>) =>
      api(`/vendedor/produtos${product ? `/${product.id}` : ""}`, {
        method: product ? "PUT" : "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: saved,
  })
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (!image) {
      toast.error("Adicione uma imagem ao anúncio.")
      return
    }
    save.mutate({
      nome: form.get("nome"),
      descricao: form.get("descricao"),
      categoriaId: form.get("categoriaId"),
      precoCentavos: Math.round(Number(form.get("preco")) * 100),
      estoque: Number(form.get("estoque")),
      ativo: form.get("ativo") === "on",
      imagem: image,
      atualizadoEm: product?.atualizadoEm,
    })
  }
  return (
    <form onSubmit={submit} className="form-stack product-form">
      <label className="image-upload">
        {image ? <img src={image} alt="Prévia da imagem do produto" /> : <ImagePlus size={36} />}
        <span>
          {upload.isPending
            ? "Preparando imagem…"
            : image
              ? "Trocar imagem"
              : "Adicionar foto do produto"}
        </span>
        <small>JPG, PNG ou WebP · até 5 MB</small>
        <input
          type="file"
          aria-label="Foto do produto"
          accept="image/jpeg,image/png,image/webp"
          disabled={upload.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              if (file.size > 5 * 1024 * 1024) toast.error("Escolha uma imagem de até 5 MB.")
              else upload.mutate(file)
            }
          }}
        />
      </label>
      <label>
        Nome do produto
        <input
          name="nome"
          required
          minLength={3}
          maxLength={120}
          defaultValue={product?.nome}
          placeholder="Um nome claro para o seu achado"
        />
      </label>
      <label>
        Descrição
        <textarea
          name="descricao"
          required
          minLength={20}
          maxLength={4000}
          rows={4}
          defaultValue={product?.descricao}
          placeholder="Conte os detalhes, materiais e características. Mínimo de 20 caracteres."
        />
      </label>
      <label>
        Categoria
        <select name="categoriaId" required defaultValue={product?.categoriaId ?? ""}>
          <option value="" disabled>
            Escolha a categoria
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Preço (R$)
          <input
            name="preco"
            type="number"
            required
            min="0.01"
            max="999999.99"
            step="0.01"
            defaultValue={product ? product.precoCentavos / 100 : ""}
          />
        </label>
        <label>
          Unidades em estoque
          <input
            name="estoque"
            type="number"
            required
            min="0"
            max="100000"
            step="1"
            defaultValue={product?.estoque ?? 1}
          />
        </label>
      </div>
      <label className="checkbox-label">
        <input type="checkbox" name="ativo" defaultChecked={product?.ativo ?? true} /> Publicar na
        vitrine
      </label>
      {save.isError && (
        <p className="form-error" role="alert">
          {save.error.message}
        </p>
      )}
      <Button type="submit" busy={save.isPending} disabled={upload.isPending || !image}>
        {product ? "Salvar alterações" : "Publicar produto"}
      </Button>
    </form>
  )
}

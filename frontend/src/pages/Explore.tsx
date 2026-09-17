import { useSearchParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, X } from "lucide-react"
import { useState, type FormEvent } from "react"
import { api } from "../lib/api"
import type { Catalogo, Categoria } from "../types"
import { Button, Empty, ErrorState, Loading, ProductCard } from "../components/ui"

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const [mobileFilters, setMobileFilters] = useState(false)
  const queryString = params.toString()
  const result = useQuery({
    queryKey: ["produtos", "explorar", queryString],
    queryFn: () => api<Catalogo>(`/produtos?${queryString}`),
  })
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: () => api<Categoria[]>("/categorias"),
  })
  function change(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== "pagina") next.delete("pagina")
    setParams(next)
  }
  function prices(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const next = new URLSearchParams(params)
    for (const k of ["minimo", "maximo"]) {
      const v = data.get(k)?.toString()
      if (v) next.set(k, String(Math.round(Number(v) * 100)))
      else next.delete(k)
    }
    next.delete("pagina")
    setParams(next)
    setMobileFilters(false)
  }
  const category = categorias.find((c) => c.id === params.get("categoria"))
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">Início</Link>
        <span>/</span>
        <span>Explorar</span>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SIGA SUA CURIOSIDADE</span>
          <h1>
            {params.get("busca")
              ? `Resultados para “${params.get("busca")}”`
              : (category?.nome ?? "Um universo de achados.")}
          </h1>
          <p>Escolha o que faz sentido para o seu mundo.</p>
        </div>
        <button
          className="button secondary filter-mobile-button"
          onClick={() => setMobileFilters(!mobileFilters)}
        >
          <SlidersHorizontal size={17} /> Filtros
        </button>
      </div>
      <div className="catalog-layout">
        <aside
          className={`filters ${mobileFilters ? "filters-open" : ""}`}
          aria-label="Filtros de produtos"
        >
          <div className="filters-heading">
            <h2>Filtrar por</h2>
            <SlidersHorizontal size={17} />
          </div>
          <div className="filter-group">
            <h3>Categorias</h3>
            <button
              className={!params.get("categoria") ? "filter-option selected" : "filter-option"}
              onClick={() => change("categoria", "")}
            >
              <span />
              Todas as categorias
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                className={
                  params.get("categoria") === c.id ? "filter-option selected" : "filter-option"
                }
                onClick={() => change("categoria", c.id)}
              >
                <span />
                {c.nome}
              </button>
            ))}
          </div>
          <form
            className="filter-group"
            onSubmit={prices}
            key={`${params.get("minimo")}-${params.get("maximo")}`}
          >
            <h3>Faixa de preço</h3>
            <div className="price-fields">
              <label>
                Mínimo
                <input
                  name="minimo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="R$ 0"
                  defaultValue={params.has("minimo") ? Number(params.get("minimo")) / 100 : ""}
                />
              </label>
              <label>
                Máximo
                <input
                  name="maximo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Sem limite"
                  defaultValue={params.has("maximo") ? Number(params.get("maximo")) / 100 : ""}
                />
              </label>
            </div>
            <Button className="secondary full" type="submit">
              Aplicar preço
            </Button>
          </form>
          {queryString && (
            <button className="text-link" onClick={() => setParams({})}>
              <X size={15} /> Limpar filtros
            </button>
          )}
          <div className="filter-note">
            <span className="mini-orbit" />
            <strong>Boas escolhas têm seu tempo.</strong>
            <p>Explore lojas diferentes e descubra algo seu.</p>
          </div>
        </aside>
        <section className="catalog-results" aria-label="Resultados">
          <div className="results-bar">
            <span aria-live="polite">
              {result.data
                ? `${result.data.total} produtos encontrados`
                : "Buscando seus próximos achados…"}
            </span>
            <label>
              Ordenar por
              <select
                value={params.get("ordem") ?? "destaques"}
                onChange={(e) => change("ordem", e.target.value)}
              >
                <option value="destaques">Nossa seleção</option>
                <option value="recentes">Mais recentes</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
              </select>
            </label>
          </div>
          {result.isPending ? (
            <Loading cards />
          ) : result.isError ? (
            <ErrorState retry={() => result.refetch()} />
          ) : !result.data.produtos.length ? (
            <Empty
              title="Ainda não encontramos esse achado."
              description="Tente outra busca ou ajuste os filtros."
              action={
                <Button className="secondary" onClick={() => setParams({})}>
                  <Search size={17} /> Explorar todos os produtos
                </Button>
              }
            />
          ) : (
            <>
              <div className="product-grid catalog-grid">
                {result.data.produtos.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
              {result.data.paginas > 1 && (
                <nav className="pagination" aria-label="Páginas de produtos">
                  <Button
                    className="secondary"
                    disabled={result.data.pagina <= 1}
                    onClick={() => change("pagina", String(result.data.pagina - 1))}
                  >
                    <ArrowLeft size={17} /> Anterior
                  </Button>
                  <span>
                    {result.data.pagina} de {result.data.paginas}
                  </span>
                  <Button
                    className="secondary"
                    disabled={result.data.pagina >= result.data.paginas}
                    onClick={() => change("pagina", String(result.data.pagina + 1))}
                  >
                    Próxima
                    <ArrowRight size={17} />
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  HeartPulse,
  LampDesk,
  Package,
  Shirt,
  Store,
  Truck,
} from "lucide-react"
import { api } from "../lib/api"
import type { Catalogo, Categoria } from "../types"
import { Empty, ErrorState, Loading, ProductCard } from "../components/ui"

const categoryIcons: Record<string, typeof Package> = {
  tecnologia: AudioLines,
  casa: LampDesk,
  estilo: Shirt,
  "bem-estar": HeartPulse,
  livros: BookOpen,
}

export default function Home() {
  const products = useQuery({
    queryKey: ["produtos", "home"],
    queryFn: () => api<Catalogo>("/produtos?limite=8"),
  })
  const categories = useQuery({
    queryKey: ["categorias"],
    queryFn: () => api<Categoria[]>("/categorias"),
    staleTime: 300000,
  })
  return (
    <div className="container home">
      <section className="home-banner" aria-labelledby="hero-title">
        <div className="home-banner-copy">
          <span>Bem-vindo à Órbita</span>
          <h1 id="hero-title">Produtos para o seu dia a dia.</h1>
          <p>Encontre tecnologia, itens para casa e muito mais em um só lugar.</p>
          <Link className="button" to="/explorar">
            Ver produtos <ArrowRight size={18} />
          </Link>
        </div>
        <Link
          className="home-banner-image"
          to="/explorar?categoria=casa"
          aria-label="Ver produtos para casa"
        >
          <img
            src="/images/chair.jpg"
            alt="Cadeira de madeira para casa"
            fetchPriority="high"
            width="600"
            height="600"
          />
          <span>
            Casa e decoração <ArrowRight size={17} />
          </span>
        </Link>
      </section>

      {categories.data && categories.data.length > 0 && (
        <section className="category-section" aria-labelledby="categories-title">
          <h2 id="categories-title">Compre por categoria</h2>
          <div className="category-grid">
            {categories.data.map(({ id, nome }) => {
              const Icon = categoryIcons[id] ?? Package
              return (
                <Link key={id} to={`/explorar?categoria=${id}`} className="category-card">
                  <Icon size={22} strokeWidth={1.75} />
                  <span>{nome}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="discovery-section" aria-labelledby="products-title">
        <div className="section-heading">
          <div>
            <h2 id="products-title">Produtos em destaque</h2>
            <p>Veja o que você encontra nas nossas lojas.</p>
          </div>
          <Link className="text-link" to="/explorar">
            Ver todos <ArrowRight size={17} />
          </Link>
        </div>
        {products.isPending ? (
          <Loading cards />
        ) : products.isError ? (
          <ErrorState retry={() => products.refetch()} />
        ) : !products.data.produtos.length ? (
          <Empty
            title="Nenhum produto disponível"
            description="Os produtos publicados pelas lojas aparecerão aqui."
          />
        ) : (
          <div className="product-grid">
            {products.data.produtos.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="benefits" aria-label="Como funciona">
        <div>
          <Store size={23} />
          <span>
            Diferentes lojas<small>Todos os pedidos na sua conta</small>
          </span>
        </div>
        <div>
          <Truck size={23} />
          <span>
            Frete fixo de R$ 15,00<small>Um frete para cada loja da compra</small>
          </span>
        </div>
        <div>
          <Package size={23} />
          <span>
            Acompanhe sua compra<small>Do preparo até a entrega</small>
          </span>
        </div>
      </section>
      <section className="seller-banner">
        <div>
          <h2>Quer vender por aqui?</h2>
          <p>Cadastre sua loja, publique seus produtos e acompanhe os pedidos.</p>
        </div>
        <Link className="button secondary" to="/vender">
          Conhecer a área do vendedor <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  )
}

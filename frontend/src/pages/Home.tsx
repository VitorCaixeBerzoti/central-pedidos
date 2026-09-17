import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronRight,
  HeartPulse,
  LampDesk,
  Shirt,
  Sparkles,
  Store,
  Truck,
} from "lucide-react"
import { api } from "../lib/api"
import type { Catalogo } from "../types"
import { ErrorState, Loading, ProductCard } from "../components/ui"

const categories = [
  { id: "tecnologia", nome: "Tecnologia", descricao: "Conecte possibilidades", Icon: AudioLines },
  { id: "casa", nome: "Casa & design", descricao: "Habite novas ideias", Icon: LampDesk },
  { id: "estilo", nome: "Estilo", descricao: "Do seu jeito", Icon: Shirt },
  { id: "bem-estar", nome: "Bem-estar", descricao: "Um tempo para você", Icon: HeartPulse },
  { id: "livros", nome: "Livros & ideias", descricao: "Expanda seu universo", Icon: BookOpen },
]
export default function Home() {
  const products = useQuery({
    queryKey: ["produtos", "home"],
    queryFn: () => api<Catalogo>("/produtos?limite=8"),
  })
  return (
    <div className="container home">
      <div className="intro-line">
        <span>
          <span className="live-dot" /> A SUA PRÓXIMA DESCOBERTA ESTÁ AQUI
        </span>
        <span>
          Explore o extraordinário no cotidiano <ArrowUpRight size={15} />
        </span>
      </div>
      <section className="hero-grid" aria-labelledby="hero-title">
        <div className="hero-main">
          <div className="hero-copy">
            <span className="hero-label">
              <Sparkles size={14} /> SELEÇÃO ÓRBITA
            </span>
            <h1 id="hero-title">
              Coisas boas
              <br />
              entram na
              <br /> sua <span>órbita.</span>
            </h1>
            <p>
              Encontre o que combina com você.
              <br />E descubra o que ainda vai combinar.
            </p>
            <Link className="button dark" to="/explorar">
              Encontre seu próximo achado
              <ArrowUpRight size={19} />
            </Link>
            <div className="hero-footnote">
              <span className="mini-orbit" /> Diferentes lojas. Um só universo.
            </div>
          </div>
          <div className="hero-visual">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <img
              className="hero-headphone"
              src="/images/headphones.jpg"
              alt="Headphone preto da seleção de tecnologia"
              fetchPriority="high"
              width="1000"
              height="671"
            />
            <span className="hero-star" aria-hidden="true">
              ✳
            </span>
            <Link to="/produto/10000000-0000-4000-8000-000000000001" className="hero-product-label">
              <span>
                <small>O SEU SOM. O SEU MUNDO.</small>
                <strong>Headphone Studio Wireless</strong>
              </span>
              <span className="round-arrow">
                <ArrowUpRight size={21} />
              </span>
            </Link>
            <span className="hero-vertical">ESCOLHAS QUE CONECTAM.</span>
          </div>
        </div>
        <Link className="hero-side" to="/explorar?categoria=casa">
          <img
            src="/images/lamp.jpg"
            alt="Luminária em um ambiente acolhedor"
            width="600"
            height="800"
          />
          <div className="hero-side-shade" />
          <div className="hero-side-copy">
            <span className="eyebrow">CASA & DESIGN</span>
            <h2>
              Seu espaço.
              <br /> Suas regras.
            </h2>
            <p>
              Pequenos detalhes.
              <br /> Novas perspectivas.
            </p>
          </div>
          <div className="hero-side-bottom">
            <span>Encontre sua inspiração</span>
            <span className="round-arrow">
              <ArrowUpRight size={23} />
            </span>
          </div>
        </Link>
      </section>
      <section className="benefits" aria-label="Como funciona">
        <div>
          <Store size={20} />
          <span>
            Lojas independentes<strong>Mais histórias para descobrir</strong>
          </span>
        </div>
        <div>
          <Truck size={21} />
          <span>
            Frete sem surpresas<strong>R$ 15 por loja, desde o carrinho</strong>
          </span>
        </div>
        <div>
          <Check size={21} />
          <span>
            Cada etapa, à vista<strong>Acompanhe seus pedidos</strong>
          </span>
        </div>
      </section>
      <section className="category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">UM MUNDO PARA EXPLORAR</span>
            <h2>Encontre a sua frequência.</h2>
          </div>
          <Link className="text-link" to="/explorar">
            Ver tudo
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map(({ id, nome, descricao, Icon }) => (
            <Link
              key={id}
              to={`/explorar?categoria=${id}`}
              className={`category-card category-${id}`}
            >
              <span className="category-icon">
                <Icon size={28} strokeWidth={1.5} />
              </span>
              <span>
                <strong>{nome}</strong>
                <small>{descricao}</small>
              </span>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <section className="discovery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ESCOLHIDOS PARA ENTRAR NA SUA ÓRBITA</span>
            <h2>
              Achados que merecem um clique<span className="lime-dot">.</span>
            </h2>
          </div>
          <Link className="text-link" to="/explorar">
            Explorar coleção
            <ArrowRight size={18} />
          </Link>
        </div>
        {products.isPending ? (
          <Loading cards />
        ) : products.isError ? (
          <ErrorState retry={() => products.refetch()} />
        ) : (
          <div className="product-grid">
            {products.data.produtos.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>
      <section className="seller-banner">
        <div className="seller-banner-orbits" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="eyebrow">SUA MARCA TEM ESPAÇO AQUI</span>
        <div>
          <h2>
            O próximo grande achado
            <br />
            pode estar na sua loja.
          </h2>
          <Link className="button" to="/vender">
            Comece a vender
            <ArrowUpRight size={19} />
          </Link>
        </div>
        <p>Publique seus produtos e encontre novas possibilidades.</p>
      </section>
    </div>
  )
}

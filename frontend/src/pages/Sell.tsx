import { Link } from "react-router-dom"
import { ArrowUpRight, Boxes, PackageCheck, Store } from "lucide-react"
import { useSession } from "../lib/session"
import { Button } from "../components/ui"
export default function Sell() {
  const { session, setAuthOpen } = useSession()
  return (
    <div className="container page">
      <section className="sell-hero">
        <span className="eyebrow">ÁREA DO VENDEDOR</span>
        <h1>Venda seus produtos na Órbita</h1>
        <p>Cadastre sua loja, organize o catálogo e gerencie seus pedidos em um só lugar.</p>
        {session.conta?.papel === "VENDEDOR" ? (
          <Link to="/painel" className="button">
            Ir para minha loja
            <ArrowUpRight size={18} />
          </Link>
        ) : (
          <Button onClick={() => setAuthOpen(true)}>
            Criar minha conta de vendedor
            <ArrowUpRight size={18} />
          </Button>
        )}
      </section>
      <div className="sell-steps">
        {[
          {
            Icon: Store,
            title: "Cadastre sua loja",
            text: "Crie uma conta vendedora e dê um nome à sua loja. A publicação é livre nesta demonstração.",
          },
          {
            Icon: Boxes,
            title: "Publique seus produtos",
            text: "Adicione fotos, descrições, preço e estoque. Organize seus produtos em várias categorias.",
          },
          {
            Icon: PackageCheck,
            title: "Acompanhe cada pedido",
            text: "Receba pedidos e avance do preparo à entrega. Cada etapa fica registrada no histórico.",
          },
        ].map(({ Icon, title, text }, i) => (
          <article className="surface" key={title}>
            <span className="eyebrow">0{i + 1}</span>
            <Icon size={32} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <p className="demo-note centered">
        Ambiente de demonstração: vendas, pagamentos e entregas são simulados.
      </p>
    </div>
  )
}

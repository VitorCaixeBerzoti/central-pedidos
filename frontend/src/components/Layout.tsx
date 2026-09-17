import { useState, type FormEvent, useEffect } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  Store,
  UserRound,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "../lib/api"
import { useSession, useCart } from "../lib/session"
import type { Categoria } from "../types"
import { AuthModal } from "./AuthModal"
import { Button, Logo, Modal } from "./ui"

export default function Layout() {
  const { session, setAuthOpen, switchAccount, removeAccount, logout, error } = useSession()
  const { data: cart } = useCart()
  const { data: categories = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: () => api<Categoria[]>("/categorias"),
    staleTime: 300000,
  })
  const [profilesOpen, setProfilesOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    setMenuOpen(false)
  }, [location.pathname])
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get("busca")?.toString().trim()
    navigate(`/explorar${q ? `?busca=${encodeURIComponent(q)}` : ""}`)
  }
  async function accountAction(action: () => Promise<unknown>, destination?: string) {
    setBusy(true)
    try {
      await action()
      if (destination) {
        setProfilesOpen(false)
        navigate(destination)
      }
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <div className="announcement">
        <div className="container">
          <span>Novas lojas. Novas ideias. Seu próximo achado.</span>
          <span className="demo-indicator">
            <span /> Experiência demonstrativa
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <Logo />
          <form className="header-search" role="search" onSubmit={search}>
            <Search size={19} />
            <input
              name="busca"
              type="search"
              placeholder="O que está na sua órbita?"
              aria-label="Buscar produtos"
            />
            <button type="submit" aria-label="Pesquisar">
              <ArrowUpRight size={19} />
            </button>
          </form>
          <div className="header-actions">
            <button
              className="profile-trigger"
              aria-label={
                session.conta ? `Abrir perfis de ${session.conta.nome}` : "Entrar ou criar conta"
              }
              onClick={() => (session.conta ? setProfilesOpen(true) : setAuthOpen(true))}
            >
              <span className="avatar">
                {session.conta ? (
                  session.conta.nome.slice(0, 1).toUpperCase()
                ) : (
                  <UserRound size={19} />
                )}
              </span>
              <span className="profile-label">
                <small>{session.conta ? "Bom ter você aqui," : "Seu espaço"}</small>
                <strong>{session.conta?.nome.split(" ")[0] ?? "Entre ou cadastre-se"}</strong>
              </span>
              <ChevronDown size={14} />
            </button>
            <span className="header-divider" />
            <Link
              className="bag-button"
              to="/carrinho"
              aria-label={`Carrinho, ${cart?.quantidade ?? 0} itens`}
            >
              <ShoppingBag size={23} />
              {!!cart?.quantidade && <span>{cart.quantidade}</span>}
            </Link>
            <button
              className="icon-button mobile-menu-toggle"
              aria-label="Abrir navegação"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu />
            </button>
          </div>
        </div>
        <nav
          aria-label="Navegação principal"
          className={`container header-nav ${menuOpen ? "menu-open" : ""}`}
        >
          <div>
            <NavLink to="/explorar">Explorar tudo</NavLink>
            {categories.slice(0, 5).map((c) => (
              <NavLink key={c.id} to={`/explorar?categoria=${c.id}`}>
                {c.nome}
              </NavLink>
            ))}
          </div>
          <Link to={session.conta?.papel === "VENDEDOR" ? "/painel" : "/vender"}>
            <Store size={16} />{" "}
            {session.conta?.papel === "VENDEDOR" ? "Minha loja" : "Venda na Órbita"}
            <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>
      {error && (
        <div className="connection-warning" role="alert">
          Não foi possível conectar ao servidor. Confira se a API está funcionando.
        </div>
      )}
      <main id="conteudo" tabIndex={-1}>
        <Outlet key={session.conta?.id ?? "visitante"} />
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Logo light />
            <p>
              Boas descobertas.
              <br />
              Novas possibilidades.
            </p>
          </div>
          <div>
            <h3>Explore seu universo</h3>
            {categories.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/explorar?categoria=${c.id}`}>
                {c.nome}
              </Link>
            ))}
          </div>
          <div>
            <h3>Seu espaço</h3>
            <Link to="/compras">Minhas compras</Link>
            <button onClick={() => (session.conta ? setProfilesOpen(true) : setAuthOpen(true))}>
              Meus perfis
            </button>
            <Link to="/vender">Comece a vender</Link>
            <Link to="/conta">Minha conta</Link>
          </div>
          <div className="footer-note">
            <span className="eyebrow">FEITO PARA EXPLORAR</span>
            <p>
              Um marketplace.
              <br />
              Muitos caminhos.
            </p>
            <span className="footer-orbit" aria-hidden="true">
              ↗
            </span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Órbita. Um projeto em movimento.</span>
          <span>Ambiente de demonstração · pagamentos e entregas simulados</span>
        </div>
      </footer>
      <AuthModal />
      <Modal open={profilesOpen} onClose={() => setProfilesOpen(false)} title="Seus perfis">
        <p className="muted">Troque de conta em um clique neste navegador.</p>
        <div className="profile-list">
          {session.perfis.map((conta) => (
            <div
              className={`profile-row ${session.conta?.id === conta.id ? "active" : ""}`}
              key={conta.id}
            >
              <button
                className="profile-select"
                disabled={busy}
                onClick={() =>
                  accountAction(
                    () => switchAccount(conta.id),
                    conta.papel === "VENDEDOR" ? "/painel" : "/",
                  )
                }
              >
                <span className="avatar">{conta.nome[0]}</span>
                <span>
                  <strong>{conta.nome}</strong>
                  <small>
                    {conta.papel === "VENDEDOR" ? conta.empresa?.nome : "Comprador"} · {conta.email}
                  </small>
                </span>
                {session.conta?.id === conta.id && <Check size={19} />}
              </button>
              <button
                className="icon-button"
                disabled={busy}
                aria-label={`Remover perfil ${conta.nome}`}
                onClick={() => accountAction(() => removeAccount(conta.id))}
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>
        <Button
          className="secondary full"
          disabled={busy || session.perfis.length >= 5}
          onClick={() => {
            setProfilesOpen(false)
            setAuthOpen(true)
          }}
        >
          <Plus size={18} /> Adicionar outro perfil
        </Button>
        <Link className="settings-link" to="/conta" onClick={() => setProfilesOpen(false)}>
          Configurações da conta ativa
          <ArrowUpRight size={16} />
        </Link>
        <button
          className="logout-button"
          disabled={busy}
          onClick={() => accountAction(logout, "/")}
        >
          <LogOut size={17} /> Sair de todas neste navegador
        </button>
      </Modal>
    </>
  )
}

import { useEffect, useId, useRef, type ReactNode, type ButtonHTMLAttributes } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, CircleAlert, LoaderCircle, PackageOpen, X } from "lucide-react"
import type { Produto, Status } from "../types"
import { money } from "../lib/api"

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`logo ${light ? "logo-light" : ""}`} aria-label="Órbita — início">
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="3" />
        <ellipse
          cx="20"
          cy="20"
          rx="19"
          ry="6"
          transform="rotate(-35 20 20)"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span>
        órbita<span className="logo-dot">.</span>
      </span>
    </Link>
  )
}
export function Button({
  children,
  busy,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button {...props} disabled={props.disabled || busy} className={`button ${className}`}>
      {busy ? <LoaderCircle size={18} className="spin" /> : null}
      {children}
    </button>
  )
}
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal()
    else if (!open) ref.current?.close()
  }, [open])
  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = previous
      }
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2 id={id}>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={21} />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  )
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <PackageOpen size={34} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  )
}
export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="empty" role="alert">
      <CircleAlert size={32} />
      <h2>Não conseguimos carregar agora.</h2>
      <p>Confira sua conexão e tente novamente.</p>
      {retry && (
        <Button className="secondary" onClick={retry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
export function Loading({ cards = false }: { cards?: boolean }) {
  return cards ? (
    <div className="product-grid" aria-label="Carregando produtos" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-picture" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-short" />
        </div>
      ))}
    </div>
  ) : (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Carregando…
    </div>
  )
}
export const statusLabels: Record<Status, string> = {
  PAGO: "Pago",
  PREPARANDO: "Preparando",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
}
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      <span />
      {statusLabels[status]}
    </span>
  )
}
export function ProductCard({ product, index = 0 }: { product: Produto; index?: number }) {
  return (
    <Link
      className="product-card"
      to={`/produto/${product.id}`}
      style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
    >
      <div className="product-photo">
        <img src={product.imagem} alt={product.nome} loading="lazy" width="600" height="600" />
        {product.estoque === 0 ? (
          <span className="product-tag neutral">Esgotado</span>
        ) : product.destaque ? (
          <span className="product-tag">Nossa seleção</span>
        ) : null}
        <span className="product-arrow">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="product-meta">
        <span>{product.categoria.nome}</span>
        <span>{product.empresa.nome}</span>
      </div>
      <h3>{product.nome}</h3>
      <div className="product-price">{money(product.precoCentavos)}</div>
      <p className="product-caption">Frete de R$ 15,00 por loja</p>
    </Link>
  )
}

import { useState } from "react"
import { Check, ChevronDown, MapPin, Package, Store, Truck } from "lucide-react"
import type { Pedido, Status } from "../types"
import { dateTime, money } from "../lib/api"
import { Button, Modal, StatusBadge, statusLabels } from "./ui"

const steps: Status[] = ["PAGO", "PREPARANDO", "ENVIADO", "ENTREGUE"]
const nextStatus: Partial<Record<Status, { status: Status; label: string }>> = {
  PAGO: { status: "PREPARANDO", label: "Preparar pedido" },
  PREPARANDO: { status: "ENVIADO", label: "Marcar como enviado" },
  ENVIADO: { status: "ENTREGUE", label: "Confirmar entrega" },
}
export function OrderCard({
  order,
  seller = false,
  pending,
  change,
}: {
  order: Pedido
  seller?: boolean
  pending: boolean
  change: (id: number, status: Status) => void
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const next = nextStatus[order.status]
  return (
    <article className="order-card surface">
      <div className="order-card-heading">
        <div>
          <span className="order-code">{order.codigo}</span>
          <span>
            <Store size={15} />
            {order.loja.nome}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="order-items">
        {order.itens.map((item) => (
          <div className="order-item" key={item.id}>
            <img src={item.imagem} alt={item.nome} width="64" height="64" />
            <div>
              <h3>{item.nome}</h3>
              <span>
                {item.quantidade} {item.quantidade === 1 ? "unidade" : "unidades"} ·{" "}
                {money(item.precoCentavos)} cada
              </span>
            </div>
            <strong>{money(item.quantidade * item.precoCentavos)}</strong>
          </div>
        ))}
      </div>
      {order.status !== "CANCELADO" && (
        <ol className="order-progress" aria-label="Etapas do pedido">
          {steps.map((step, index) => (
            <li key={step} className={index <= steps.indexOf(order.status) ? "done" : ""}>
              <span>{index <= steps.indexOf(order.status) ? <Check size={13} /> : index + 1}</span>
              {statusLabels[step]}
            </li>
          ))}
        </ol>
      )}
      {order.estorno && (
        <div className="refund-note">
          <Check size={17} />
          <span>
            Estorno simulado de <strong>{money(order.estorno.valorCentavos)}</strong> registrado.
            Estoque devolvido à loja.
          </span>
        </div>
      )}
      <div className="order-card-bottom">
        <span>Inclui frete de {money(order.freteCentavos)}</span>
        <strong>Total do pedido {money(order.totalCentavos)}</strong>
      </div>
      <details className="order-details">
        <summary>
          Histórico e entrega
          <ChevronDown size={16} />
        </summary>
        <div className="order-details-content">
          <div>
            <h4>
              <Package size={16} /> Histórico do pedido
            </h4>
            {order.historico.map((event) => (
              <p className="history-event" key={event.id}>
                <span>{statusLabels[event.status_novo] ?? event.status_novo}</span>
                <time dateTime={event.criado_em}>{dateTime(event.criado_em)}</time>
              </p>
            ))}
          </div>
          <div>
            <h4>
              <MapPin size={16} /> Endereço de demonstração
            </h4>
            <p>
              {order.compra.endereco.destinatario}
              <br />
              {order.compra.endereco.rua}, {order.compra.endereco.numero}
              {order.compra.endereco.complemento && ` — ${order.compra.endereco.complemento}`}
              <br />
              {order.compra.endereco.cidade} / {order.compra.endereco.estado}
              <br />
              CEP {order.compra.endereco.cep}
            </p>
          </div>
        </div>
      </details>
      {((next && seller) || ["PAGO", "PREPARANDO"].includes(order.status)) && (
        <div className="order-actions">
          {["PAGO", "PREPARANDO"].includes(order.status) && (
            <button
              className="text-link danger-text"
              disabled={pending}
              onClick={() => setCancelOpen(true)}
            >
              Cancelar pedido
            </button>
          )}
          {seller && next && (
            <Button busy={pending} onClick={() => change(order.id, next.status)}>
              <Truck size={17} />
              {next.label}
            </Button>
          )}
        </div>
      )}
      <Modal open={cancelOpen} title="Cancelar este pedido?" onClose={() => setCancelOpen(false)}>
        <p>
          Os produtos da <strong>{order.loja.nome}</strong> voltarão ao estoque. Será registrado um
          estorno simulado de <strong>{money(order.totalCentavos)}</strong>, incluindo o frete.
        </p>
        <p className="muted">Os pedidos das outras lojas continuam normalmente.</p>
        <div className="dialog-actions">
          <Button className="secondary" onClick={() => setCancelOpen(false)}>
            Manter pedido
          </Button>
          <Button
            className="danger"
            onClick={() => {
              setCancelOpen(false)
              change(order.id, "CANCELADO")
            }}
          >
            Confirmar cancelamento
          </Button>
        </div>
      </Modal>
    </article>
  )
}

export type Papel = "COMPRADOR" | "VENDEDOR"
export interface Conta {
  id: string
  nome: string
  email: string
  papel: Papel
  empresaId: number | null
  empresa: { id: number; nome: string; descricao: string } | null
}
export interface Sessao {
  conta: Conta | null
  perfis: Conta[]
}
export interface Categoria {
  id: string
  nome: string
}
export interface Produto {
  id: string
  nome: string
  descricao: string
  precoCentavos: number
  estoque: number
  imagem: string
  ativo: boolean
  destaque: boolean
  categoriaId: string
  categoria: Categoria
  empresaId: number
  empresa: { id: number; nome: string; descricao: string }
  criadoEm: string
  atualizadoEm: string
}
export interface Catalogo {
  produtos: Produto[]
  total: number
  pagina: number
  paginas: number
}
export interface ItemCarrinho {
  produtoId: string
  quantidade: number
  produto: Produto
}
export interface GrupoCarrinho {
  loja: { id: number; nome: string }
  freteCentavos: number
  subtotalCentavos: number
  itens: ItemCarrinho[]
}
export interface Carrinho {
  grupos: GrupoCarrinho[]
  quantidade: number
  subtotalCentavos: number
  freteCentavos: number
  totalCentavos: number
  cotacao: string
}
export type Status = "PAGO" | "PREPARANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO"
export interface Endereco {
  destinatario: string
  cep: string
  rua: string
  numero: string
  complemento: string
  cidade: string
  estado: string
}
export interface Pedido {
  id: number
  codigo: string
  status: Status
  criadoEm: string
  totalCentavos: number
  freteCentavos: number
  loja: { id: number; nome: string }
  compra: { id: string; endereco: Endereco; criadoEm: string }
  estorno: { valorCentavos: number; criadoEm: string } | null
  historico: { id: number; status_anterior: string; status_novo: Status; criado_em: string }[]
  itens: {
    id: number
    produtoId: string
    nome: string
    imagem: string
    quantidade: number
    precoCentavos: number
  }[]
}
export interface Compra {
  id: string
  totalCentavos: number
  pagamento: string
  criadoEm: string
  pedidos: Pedido[]
}
export interface Resumo {
  produtos: number
  estoqueBaixo: number
  pedidos: number
  vendasCentavos: number
  preparar: number
  porStatus: { status: Status; quantidade: number }[]
}

let contaAtiva: string | null = null
export function definirConta(id: string | null) {
  contaAtiva = id
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-Orbita-Request": "1",
      ...(contaAtiva ? { "X-Account-Id": contaAtiva } : {}),
      ...init?.headers,
    },
  })
  const dados = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new ApiError(
      dados.mensagem ?? "Não foi possível conectar. Tente novamente.",
      response.status,
    )
  return dados as T
}
export const money = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const date = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

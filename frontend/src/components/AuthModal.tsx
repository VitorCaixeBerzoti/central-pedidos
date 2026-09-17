import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { ArrowRight, Eye, EyeOff, ShoppingBag, Store } from "lucide-react"
import { toast } from "sonner"
import { api } from "../lib/api"
import { useSession } from "../lib/session"
import { Button, Modal } from "./ui"
import type { Papel } from "../types"

export function AuthModal() {
  const { authOpen, setAuthOpen, sync, session } = useSession()
  return (
    <Modal
      open={authOpen}
      onClose={() => setAuthOpen(false)}
      title={session.conta ? "Conecte outro perfil" : "Seu universo começa aqui"}
    >
      <AuthForm close={() => setAuthOpen(false)} sync={sync} />
    </Modal>
  )
}
function AuthForm({
  close,
  sync,
}: {
  close: () => void
  sync: () => Promise<import("../types").Sessao>
}) {
  const [cadastro, setCadastro] = useState(false)
  const [papel, setPapel] = useState<Papel>("COMPRADOR")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async (dados: Record<string, unknown>) => {
      await api(`/sessao/${cadastro ? "cadastro" : "login"}`, {
        method: "POST",
        body: JSON.stringify(dados),
      })
      return sync()
    },
    onSuccess: (data) => {
      close()
      toast.success("Tudo pronto. Bem-vindo à Órbita!")
      if (data.conta?.papel === "VENDEDOR") navigate("/painel")
    },
  })
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.currentTarget))
    mutation.mutate(cadastro ? { ...form, papel } : form)
  }
  return (
    <>
      <p className="muted">Entre para descobrir, comprar e acompanhar seus achados.</p>
      <div className="segmented">
        <button
          className={!cadastro ? "selected" : ""}
          onClick={() => {
            setCadastro(false)
            mutation.reset()
          }}
        >
          Entrar
        </button>
        <button
          className={cadastro ? "selected" : ""}
          onClick={() => {
            setCadastro(true)
            mutation.reset()
          }}
        >
          Criar conta
        </button>
      </div>
      <form onSubmit={submit} className="form-stack">
        {cadastro && (
          <>
            <div className="role-options">
              <button
                type="button"
                aria-pressed={papel === "COMPRADOR"}
                className={papel === "COMPRADOR" ? "selected" : ""}
                onClick={() => setPapel("COMPRADOR")}
              >
                <ShoppingBag size={20} /> Quero comprar
              </button>
              <button
                type="button"
                aria-pressed={papel === "VENDEDOR"}
                className={papel === "VENDEDOR" ? "selected" : ""}
                onClick={() => setPapel("VENDEDOR")}
              >
                <Store size={20} /> Quero vender
              </button>
            </div>
            <label>
              Seu nome
              <input
                name="nome"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
                placeholder="Como podemos chamar você?"
              />
            </label>
            {papel === "VENDEDOR" && (
              <label>
                Nome da loja
                <input
                  name="loja"
                  minLength={2}
                  maxLength={100}
                  required
                  placeholder="A sua marca na Órbita"
                />
              </label>
            )}
          </>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            placeholder="voce@exemplo.com"
          />
        </label>
        <label>
          Senha
          <div className="password-field">
            <input
              name="senha"
              type={showPassword ? "text" : "password"}
              autoComplete={cadastro ? "new-password" : "current-password"}
              minLength={cadastro ? 12 : 1}
              maxLength={72}
              required
              placeholder={cadastro ? "Pelo menos 12 caracteres" : "Sua senha"}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {mutation.isError && (
          <p className="form-error" role="alert">
            {mutation.error.message}
          </p>
        )}
        <Button busy={mutation.isPending} className="full" type="submit">
          {cadastro ? "Criar minha conta" : "Entrar na minha conta"}
          <ArrowRight size={18} />
        </Button>
      </form>
      <p className="auth-note">
        Este é um marketplace de demonstração. Nenhum pagamento real será realizado.
      </p>
    </>
  )
}

import { useMutation } from "@tanstack/react-query"
import { useRef, type FormEvent } from "react"
import { LockKeyhole, UserRound } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "../lib/session"
import { api } from "../lib/api"
import { AccessGate } from "../components/AccessGate"
import { Button } from "../components/ui"
export default function Account() {
  return (
    <AccessGate>
      <AccountContent />
    </AccessGate>
  )
}
function AccountContent() {
  const { session, sync } = useSession()
  const form = useRef<HTMLFormElement>(null)
  const change = useMutation({
    mutationFn: (dados: Record<string, FormDataEntryValue>) =>
      api("/sessao/senha", { method: "PATCH", body: JSON.stringify(dados) }),
    onSuccess: async () => {
      await sync()
      form.current?.reset()
      toast.success("Senha alterada. Outras sessões desta conta foram encerradas.")
    },
  })
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    change.mutate(Object.fromEntries(new FormData(e.currentTarget)))
  }
  return (
    <div className="container page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DO SEU JEITO</span>
          <h1>Minha conta.</h1>
          <p>Seus dados e a segurança do seu perfil.</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="surface account-card">
          <span className="avatar avatar-large">
            <UserRound size={29} />
          </span>
          <h2>{session.conta!.nome}</h2>
          <p>{session.conta!.email}</p>
          <span className="visibility visible">
            {session.conta!.papel === "COMPRADOR" ? "Conta compradora" : "Conta vendedora"}
          </span>
          <p className="muted">
            Para alternar entre contas conectadas ou sair delas, abra o menu do seu perfil no topo.
          </p>
        </section>
        <form ref={form} onSubmit={submit} className="surface form-stack settings-form">
          <h2>
            <LockKeyhole size={21} /> Alterar senha
          </h2>
          <p className="muted">
            Confirme a senha atual desta conta. Após a alteração, ela será desconectada dos outros
            navegadores.
          </p>
          <label>
            Senha atual
            <input
              name="senhaAtual"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
            />
          </label>
          <label>
            Nova senha
            <input
              name="novaSenha"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              placeholder="Pelo menos 12 caracteres"
            />
          </label>
          {change.isError && (
            <p className="form-error" role="alert">
              {change.error.message}
            </p>
          )}
          <Button type="submit" busy={change.isPending}>
            Atualizar senha
          </Button>
        </form>
      </div>
    </div>
  )
}

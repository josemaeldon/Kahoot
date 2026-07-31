import Header from "@components/Header";
import styles from "@styles/Auth.module.css";
import Link from "next/link";
import NoticeModal from "@components/NoticeModal";
import { FiLock, FiMail } from "react-icons/fi";
import { FormEvent, useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; message: string } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setNotice(null);
    try {
      const response = await fetch("/api/password/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const payload = await response.json();
      setNotice({ error: Boolean(payload.error), message: payload.errorDescription || payload.message });
    } catch { setNotice({ error: true, message: "Não foi possível conectar ao servidor." }); }
    finally { setLoading(false); }
  }
  return (
    <main className={styles.page}>
      <Header authMode />
      <div className={styles.layout}>
        <aside className={styles.art} aria-hidden="true">
          <span className={`${styles.artBlock} ${styles.artRed}`} />
          <span className={`${styles.artBlock} ${styles.artBlue}`} />
          <span className={`${styles.artBlock} ${styles.artYellow}`} />
          <span className={`${styles.artBlock} ${styles.artGreen}`} />
          <span className={styles.questionMark}>?</span>
        </aside>

        <section className={styles.formRegion}>
          <form className={styles.form} onSubmit={(event) => void submit(event)}>
            <div className={styles.heading}>
              <span className={styles.lockBadge}>
                <FiLock aria-hidden="true" />
              </span>
              <h1>Recuperação de senha</h1>
              <p>
                Informe o e-mail cadastrado para receber um link válido por 1 hora.
              </p>
            </div>
            <label className={styles.field}>
              <span>E-mail</span>
              <div className={styles.inputShell}><FiMail aria-hidden="true" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="voce@exemplo.com" required /></div>
            </label>
            <button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? "Enviando..." : "Enviar link de recuperação"}</button>
            <Link href="/auth/login" className={styles.primaryButton}>
              Voltar para entrar
            </Link>
          </form>
        </section>
      </div>
      <NoticeModal open={notice !== null} title={notice?.error ? "Não foi possível enviar" : "Verifique seu e-mail"} messages={notice ? [notice.message] : []} tone={notice?.error ? "error" : "info"} onClose={() => setNotice(null)} />
    </main>
  );
}

export default ForgotPassword;

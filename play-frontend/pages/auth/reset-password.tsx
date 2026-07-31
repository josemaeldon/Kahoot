import Header from "@components/Header";
import NoticeModal from "@components/NoticeModal";
import styles from "@styles/Auth.module.css";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { FiLock } from "react-icons/fi";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    try {
      const response = await fetch("/api/password/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: router.query.token, password, passwordConfirmation: confirmation }) });
      const payload = await response.json();
      if (payload.error) throw new Error(payload.errorDescription);
      await router.replace("/auth/login?passwordReset=success");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível redefinir a senha."); }
    finally { setLoading(false); }
  }
  return <main className={styles.page}><Header authMode /><div className={styles.layout}><aside className={styles.art} aria-hidden="true"><span className={`${styles.artBlock} ${styles.artRed}`} /><span className={`${styles.artBlock} ${styles.artBlue}`} /><span className={`${styles.artBlock} ${styles.artYellow}`} /><span className={`${styles.artBlock} ${styles.artGreen}`} /><span className={styles.questionMark}>?</span></aside><section className={styles.formRegion}><form className={styles.form} onSubmit={(event) => void submit(event)}><div className={styles.heading}><span className={styles.lockBadge}><FiLock /></span><h1>Crie uma nova senha</h1><p>Use entre 8 e 128 caracteres.</p></div><label className={styles.field}><span>Nova senha</span><div className={styles.inputShell}><FiLock /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required /></div></label><label className={styles.field}><span>Confirme a nova senha</span><div className={styles.inputShell}><FiLock /><input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required /></div></label><button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? "Redefinindo..." : "Redefinir senha"}</button></form></section></div><NoticeModal open={error !== null} title="Não foi possível redefinir" messages={error ? [error] : []} tone="error" onClose={() => setError(null)} /></main>;
}

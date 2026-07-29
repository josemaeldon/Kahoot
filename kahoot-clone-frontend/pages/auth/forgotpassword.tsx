import Header from "@components/Header";
import styles from "@styles/Auth.module.css";
import Link from "next/link";
import { FiLock } from "react-icons/fi";

function ForgotPassword() {
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
          <div className={styles.form}>
            <div className={styles.heading}>
              <span className={styles.lockBadge}>
                <FiLock aria-hidden="true" />
              </span>
              <h1>Recuperação de senha</h1>
              <p>
                A recuperação automática ainda não está configurada neste
                ambiente. Fale com o administrador para redefinir seu acesso.
              </p>
            </div>
            <Link href="/auth/login" className={styles.primaryButton}>
              Voltar para entrar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ForgotPassword;

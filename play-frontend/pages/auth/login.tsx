import React, { useEffect, useState } from "react";
import styles from "@styles/Auth.module.css";
import Link from "next/link";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "pages/api/login";
import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import Header from "@components/Header";
import NoticeModal from "@components/NoticeModal";
import { FiLock, FiUser } from "react-icons/fi";

function Login() {
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { loggedIn, loading } = useUser();

  useEffect(() => {
    if (!loading && loggedIn) void router.replace("/");
  }, [loading, loggedIn, router]);

  const loginHandler = async () => {
    setError(null);
    setIsLoading(true);
    const request: APIRequest = { identifier, password };
    try {
      const response = await postData<APIRequest, APIResponse>(
        "/api/login",
        request
      );
      if (response.error) {
        setError(response.errorDescription || "Ocorreu um erro inesperado.");
      } else {
        const redirect =
          typeof router.query.redirectOnLogin === "string"
            ? router.query.redirectOnLogin
            : "/";
        window.location.assign(redirect);
      }
    } catch (err) {
      setError("Falha ao conectar-se ao servidor. Tente novamente.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || loggedIn) return null;

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
          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void loginHandler();
            }}
          >
            <div className={styles.heading}>
              <h1>Bem-vindo de volta</h1>
              <p>Entre para criar, editar e iniciar seus Plays!</p>
            </div>

            <label className={styles.field}>
              <span>Usuário ou e-mail</span>
              <div className={styles.inputShell}>
                <FiUser aria-hidden="true" />
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Digite seu usuário ou e-mail"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>Senha</span>
              <div className={styles.inputShell}>
                <FiLock aria-hidden="true" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            <p className={styles.switchText}>
              <Link href="/auth/forgotpassword">Esqueci a senha</Link>
            </p>

            <p className={styles.switchText}>
              Não tem uma conta?{" "}
              <Link href="/auth/signup">Criar conta</Link>
            </p>
          </form>
        </section>
      </div>

      <NoticeModal
        open={error !== null}
        title="Não foi possível entrar"
        messages={error ? [error] : []}
        tone="error"
        onClose={() => setError(null)}
      />
    </main>
  );
}

export default Login;

import React, { useState } from "react";
import styles from "@styles/signup.module.css";
import Link from "next/link";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "pages/api/login";
import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import Header from "@components/Header";

function Login() {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { loggedIn, user } = useUser();

  if (loggedIn) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  const loginHandler = async () => {
    const request: APIRequest = { username, password };
    try {
      const response = await postData<APIRequest, APIResponse>(
        "/api/login",
        request
      );
      if (response.error === true) {
        setError(response.errorDescription || "Ocorreu um erro inesperado.");
      } else {
        localStorage.setItem(
          "accessTokenPayload",
          JSON.stringify(response.user)
        );
        const redirect =
          typeof router.query.redirectOnLogin === "string"
            ? router.query.redirectOnLogin
            : "/";
        router.push(redirect);
      }
    } catch (err) {
      setError("Falha ao conectar-se ao servidor. Por favor, tente novamente.");
      console.error(err);
    }
  };

  return (
    <div className={styles.vh100}>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              loginHandler();
            }}
          >
            <h2 className={styles.title}>Log In</h2>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                type="text"
                id="username"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Senha
              </label>
              <input
                type="password"
                id="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>

            <button type="submit" className={styles.button}>
              Log In
            </button>

            <p className={styles.signupPrompt}>
              {"Não tem uma conta? "}
              <Link href="/auth/signup">
                <a className={styles.signupLink}>Sign up</a>
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

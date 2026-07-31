import React, { useEffect, useState } from "react";
import styles from "@styles/Auth.module.css";
import Link from "next/link";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "pages/api/signup";
import { useRouter } from "next/router";
import Header from "@components/Header";
import NoticeModal from "@components/NoticeModal";
import useUser from "@lib/useUser";
import { maskCpfOrCnpj, maskPhone } from "@lib/masks";
import { FiCreditCard, FiEye, FiEyeOff, FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";

interface Info {
  fullName: string;
  email: string;
  cpf: string;
  username: string;
  whatsapp: string;
  password: string;
}

function Signup() {
  const [info, setInfo] = useState<Info>({
    fullName: "",
    email: "",
    cpf: "",
    username: "",
    whatsapp: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState<
    boolean | null
  >(null);
  const [registrationNotice, setRegistrationNotice] = useState(false);
  const router = useRouter();
  const { loggedIn, loading } = useUser();

  useEffect(() => {
    if (!loading && loggedIn) void router.replace("/");
  }, [loading, loggedIn, router]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/registration-status", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((response) => {
        if (!response.error) {
          setRegistrationEnabled(response.registrationEnabled);
          setRegistrationNotice(!response.registrationEnabled);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const signupHandler = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await postData<APIRequest, APIResponse>("/api/signup", {
        fullName: info.fullName,
        email: info.email,
        cpf: info.cpf,
        username: info.username,
        whatsapp: info.whatsapp,
        password: info.password,
      });
      if (response.error) {
        setError(response.errorDescription || "Ocorreu um erro inesperado.");
      } else {
        window.location.assign("/");
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
            onSubmit={(event) => {
              event.preventDefault();
              void signupHandler();
            }}
          >
            <div className={styles.heading}>
              <h1>Crie sua conta</h1>
              <p>Comece com 30 dias gratuitos para criar seus Plays!</p>
            </div>

            <label className={styles.field}>
              <span>Nome completo</span>
              <div className={styles.inputShell}>
                <FiUser aria-hidden="true" />
                <input
                  type="text"
                  id="fullName"
                  value={info.fullName}
                  onChange={(event) => setInfo((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Nome e sobrenome"
                  autoComplete="name"
                  maxLength={160}
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>E-mail</span>
              <div className={styles.inputShell}>
                <FiMail aria-hidden="true" />
                <input
                  type="email"
                  id="email"
                  value={info.email}
                  onChange={(event) => setInfo((current) => ({ ...current, email: event.target.value.trimStart() }))}
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>CPF ou CNPJ</span>
              <div className={styles.inputShell}>
                <FiCreditCard aria-hidden="true" />
                <input
                  type="text"
                  id="cpf"
                  value={info.cpf}
                  onChange={(event) => setInfo((current) => ({ ...current, cpf: maskCpfOrCnpj(event.target.value) }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={18}
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>Usuário</span>
              <div className={styles.inputShell}>
                <FiUser aria-hidden="true" />
                <input
                  type="text"
                  id="username"
                  value={info.username}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  placeholder="Digite seu nome de usuário"
                  autoComplete="username"
                  minLength={3}
                  maxLength={40}
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>WhatsApp</span>
              <div className={styles.inputShell}>
                <FiPhone aria-hidden="true" />
                <input
                  type="tel"
                  id="whatsapp"
                  value={info.whatsapp}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      whatsapp: maskPhone(event.target.value),
                    }))
                  }
                  placeholder="(91) 99999-9999"
                  autoComplete="tel"
                  inputMode="tel"
                  aria-describedby="whatsapp-hint"
                  maxLength={15}
                  required
                />
              </div>
              <small id="whatsapp-hint">
                Obrigatório. Informe o número com DDD.
              </small>
            </label>

            <label className={styles.field}>
              <span>Senha</span>
              <div className={styles.inputShell}>
                <FiLock aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={info.password}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Digite sua senha"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <FiEyeOff aria-hidden="true" />
                  ) : (
                    <FiEye aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isLoading || registrationEnabled === false}
            >
              {isLoading
                ? "Criando conta..."
                : registrationEnabled === false
                  ? "Cadastros desativados"
                  : "Criar conta"}
            </button>

            <p className={styles.switchText}>
              Já tem uma conta?{" "}
              <Link href="/auth/login">Entrar</Link>
            </p>
          </form>
        </section>
      </div>

      <NoticeModal
        open={error !== null}
        title="Não foi possível criar a conta"
        messages={error ? [error] : []}
        tone="error"
        onClose={() => setError(null)}
      />
      <NoticeModal
        open={registrationNotice}
        title="Cadastros temporariamente desativados"
        messages={[
          "Entre em contato com o administrador para solicitar seu acesso.",
        ]}
        tone="warning"
        onClose={() => setRegistrationNotice(false)}
      />
    </main>
  );
}

export default Signup;

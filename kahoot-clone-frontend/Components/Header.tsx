import styles from "../styles/Header.module.css";
import Image from "next/image";
import useUser from "@lib/useSSRUser";
import { postData } from "@lib/postData";
import { useRouter } from "next/router";
import Link from "next/link";
import { FiClock, FiFolder, FiHome, FiLogOut, FiShield } from "react-icons/fi";
import { useState } from "react";
import AccountModal from "./AccountModal";
import NoticeModal from "./NoticeModal";
import { getAccessPeriodSummary } from "@lib/accessPeriod";

function Header({ authMode = false }: { authMode?: boolean }) {
  const { loggedIn, user, updateUser } = useUser();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [updatedNotice, setUpdatedNotice] = useState(false);
  const accessPeriod = user ? getAccessPeriodSummary(user) : null;

  return (
    <>
      <header className={styles.container}>
        <div className={styles.inner}>
          <button
            type="button"
            className={styles.brandButton}
            aria-label="Ir para o início"
            onClick={() => void router.push("/")}
          >
            <Image
              src="/kahootLogo.svg"
              width={124}
              height={43}
              alt="Kahoot!"
              priority
            />
          </button>

          {!authMode && (
            <nav className={styles.navigation} aria-label="Navegação principal">
              <Link
                href="/"
                className={`${styles.navLink} ${
                  router.pathname === "/" ? styles.navLinkActive : ""
                }`}
              >
                <FiHome aria-hidden="true" />
                Início
              </Link>
              {loggedIn && (
                <Link
                  href="/profile"
                  className={`${styles.navLink} ${
                    router.pathname === "/profile" ? styles.navLinkActive : ""
                  }`}
                >
                  <FiFolder aria-hidden="true" />
                  Meus quizzes
                </Link>
              )}
              {user?.role === "superadmin" && (
                <Link
                  href="/admin"
                  className={`${styles.navLink} ${
                    router.pathname === "/admin" ? styles.navLinkActive : ""
                  }`}
                >
                  <FiShield aria-hidden="true" />
                  Administração
                </Link>
              )}
            </nav>
          )}

          <div className={styles.actions}>
            {authMode && (
              <Link href="/" className={styles.backLink}>
                Voltar ao início
              </Link>
            )}
            {!authMode && !loggedIn && (
              <>
                <Link href="/auth/login" className={styles.secondaryAction}>
                  Entrar
                </Link>
                <Link href="/auth/signup" className={styles.primaryAction}>
                  Criar conta
                </Link>
              </>
            )}
            {!authMode && loggedIn && user && accessPeriod && (
              <button
                type="button"
                className={styles.identity}
                aria-label={`Editar dados do usuário. ${accessPeriod.label}`}
                title={accessPeriod.detail}
                onClick={() => setAccountOpen(true)}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
                <span className={styles.identityText}>
                  <span className={styles.username}>{user.username}</span>
                  <span
                    className={`${styles.accessPeriod} ${
                      styles[`accessPeriod_${accessPeriod.state}`]
                    }`}
                  >
                    <FiClock aria-hidden="true" />
                    <span className={styles.accessPeriodFull}>
                      {accessPeriod.label}
                    </span>
                    <span className={styles.accessPeriodCompact}>
                      {accessPeriod.compactLabel}
                    </span>
                  </span>
                </span>
              </button>
            )}
            {!authMode && loggedIn && (
              <button
                type="button"
                className={styles.logoutButton}
                aria-label="Sair"
                onClick={() => {
                  postData("/api/signout", {}).then(() => {
                    window.location.assign("/auth/login");
                  });
                }}
              >
                <FiLogOut aria-hidden="true" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {user && (
        <AccountModal
          open={accountOpen}
          user={user}
          onClose={() => setAccountOpen(false)}
          onUpdated={(updatedUser) => {
            updateUser(updatedUser);
            setAccountOpen(false);
            setUpdatedNotice(true);
          }}
        />
      )}
      <NoticeModal
        open={updatedNotice}
        title="Dados atualizados"
        messages={["Seu usuário e suas credenciais foram salvos."]}
        tone="info"
        onClose={() => setUpdatedNotice(false)}
      />
    </>
  );
}

export default Header;

import "bootstrap/dist/css/bootstrap.min.css";
import "@fontsource-variable/plus-jakarta-sans";
import "../styles/globals.css";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";
import useUser, { UserProvider } from "@lib/useUser";
import Head from "next/head";

const publicRoutes = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/forgotpassword",
  "/",
  "/play",
]);

function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loggedIn, loading, user } = useUser();
  const isPublic = publicRoutes.has(router.pathname);
  const requiresSuperadmin = router.pathname.startsWith("/admin");

  useEffect(() => {
    if (!loading && !loggedIn && !isPublic) {
      void router.replace({
        pathname: "/auth/login",
        query: { redirectOnLogin: router.pathname },
      });
    }
  }, [isPublic, loading, loggedIn, router]);

  useEffect(() => {
    if (
      !loading &&
      loggedIn &&
      requiresSuperadmin &&
      user?.role !== "superadmin"
    ) {
      void router.replace("/");
    }
  }, [loading, loggedIn, requiresSuperadmin, router, user?.role]);

  if (
    (!isPublic && (loading || !loggedIn)) ||
    (requiresSuperadmin && user?.role !== "superadmin")
  ) {
    return (
      <main className="appLoading" aria-live="polite">
        <span className="appSpinner" />
        <p>Carregando...</p>
      </main>
    );
  }
  return <>{children}</>;
}

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Head>
        <title>Kahoot</title>
        <meta
          name="description"
          content="Jogo multiplayer de perguntas e respostas"
        />
      </Head>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </UserProvider>
  );
}

export default MyApp;

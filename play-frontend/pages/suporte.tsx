import Head from "next/head";
import Header from "@components/Header";
import styles from "@styles/public.module.css";

export default function Support() {
  return (
    <main className={styles.page}>
      <Head>
        <title>Suporte | Play!</title>
        <meta name="description" content="Central de suporte do Play!." />
      </Head>
      <Header />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Ajuda</p>
        <h1>Como podemos ajudar?</h1>
        <p className={styles.intro}>
          Encontre respostas rápidas para as dúvidas mais comuns sobre o Play!.
          Se precisar de ajuda adicional, fale com nossa equipe pelo e-mail
          <a href="mailto:admin@cloudbr.app"> admin@cloudbr.app</a>.
        </p>
        <div className={styles.sectionGrid}>
          <article className={styles.card}>
            <h2>Como entro em uma partida?</h2>
            <p>Abra o Play!, informe o PIN exibido pelo anfitrião e escolha seu nome para participar.</p>
          </article>
          <article className={styles.card}>
            <h2>Como crio um Play!?</h2>
            <p>Crie uma conta, acesse seus Plays! e monte perguntas com as alternativas e respostas corretas.</p>
          </article>
          <article className={styles.card}>
            <h2>Minha partida desconectou</h2>
            <p>Verifique sua conexão e tente entrar novamente usando o mesmo PIN enquanto a sala estiver aberta.</p>
          </article>
          <article className={styles.card}>
            <h2>Preciso excluir minha conta</h2>
          <p>Solicite a exclusão pelo e-mail de suporte. Informe o nome de usuário da conta para agilizar o atendimento.</p>
          </article>
        </div>
        <section>
          <h2>Fale conosco</h2>
          <p>Ao entrar em contato, descreva o problema, o dispositivo utilizado e, se possível, o horário em que ocorreu.</p>
        </section>
      </div>
    </main>
  );
}

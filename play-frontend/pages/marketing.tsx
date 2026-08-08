import Head from "next/head";
import Link from "next/link";
import Header from "@components/Header";
import styles from "@styles/public.module.css";

export default function Marketing() {
  return (
    <main className={styles.page}>
      <Head>
        <title>Conheça o Play! | Play!</title>
        <meta name="description" content="Crie e jogue partidas de perguntas ao vivo com o Play!." />
      </Head>
      <Header />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Play!</p>
        <h1>Transforme perguntas em momentos inesquecíveis.</h1>
        <p className={styles.intro}>
          O Play! é uma plataforma de perguntas e respostas ao vivo para reunir
          turmas, equipes, amigos e famílias em uma experiência simples e divertida.
        </p>
        <div className={styles.sectionGrid}>
          <article className={styles.card}>
            <h2>Crie seu jogo</h2>
            <p>Monte perguntas, organize seus Plays! e escolha as respostas corretas.</p>
          </article>
          <article className={styles.card}>
            <h2>Compartilhe um PIN</h2>
            <p>Convide as pessoas para entrar pelo navegador, sem complicação e em poucos segundos.</p>
          </article>
          <article className={styles.card}>
            <h2>Jogue em tempo real</h2>
            <p>Acompanhe respostas, pontuação e classificação enquanto a partida acontece.</p>
          </article>
          <article className={styles.card}>
            <h2>Use onde quiser</h2>
            <p>Ideal para aulas, treinamentos, encontros e qualquer ocasião que mereça uma boa brincadeira.</p>
          </article>
        </div>
        <section>
          <h2>Comece agora</h2>
          <p><Link href="/">Volte para a página inicial</Link> e crie seu próximo Play!.</p>
        </section>
      </div>
    </main>
  );
}

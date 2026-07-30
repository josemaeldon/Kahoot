import Header from "@components/Header";
import styles from "@styles/index.module.css";
import { useRouter } from "next/router";
import {
  FiArrowRight,
  FiEdit3,
  FiShare2,
  FiUsers,
} from "react-icons/fi";
import {
  BsFillCircleFill,
  BsFillSquareFill,
  BsFillTriangleFill,
} from "react-icons/bs";

const steps = [
  {
    title: "Crie",
    description: "Monte perguntas e escolha as respostas corretas.",
    icon: FiEdit3,
  },
  {
    title: "Compartilhe",
    description: "Mostre o PIN da partida para sua turma ou equipe.",
    icon: FiShare2,
  },
  {
    title: "Jogue",
    description: "Acompanhe respostas e classificação em tempo real.",
    icon: FiUsers,
  },
];

function Index() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Crie perguntas. Reúna pessoas. Jogue ao vivo.</h1>
          <p>
            Monte seu Play! Compartilhe o PIN e acompanhe cada resposta em
            tempo real.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void router.push("/profile")}
            >
              Criar um Play!
              <FiArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void router.push("/play")}
            >
              Entrar com PIN
            </button>
          </div>
        </div>

        <div className={styles.preview} aria-label="Prévia de uma partida">
          <div className={styles.previewTopbar}>
            <span>
              PIN do jogo: <strong>123 456</strong>
            </span>
            <span>18 respostas</span>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewQuestion}>
              <span className={styles.previewTimer}>15</span>
              <h2>Quanto é 2 + 2?</h2>
            </div>
            <div className={styles.previewAnswers}>
              <div className={`${styles.answer} ${styles.answerRed}`}>
                <BsFillTriangleFill aria-hidden="true" />
                <span>4</span>
              </div>
              <div className={`${styles.answer} ${styles.answerBlue}`}>
                <BsFillSquareFill
                  className={styles.diamond}
                  aria-hidden="true"
                />
                <span>3</span>
              </div>
              <div className={`${styles.answer} ${styles.answerYellow}`}>
                <BsFillCircleFill aria-hidden="true" />
                <span>5</span>
              </div>
              <div className={`${styles.answer} ${styles.answerGreen}`}>
                <BsFillSquareFill aria-hidden="true" />
                <span>6</span>
              </div>
            </div>
            <div className={styles.answerStripe} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className={styles.steps} aria-labelledby="steps-title">
        <h2 id="steps-title">Três passos para um jogo incrível</h2>
        <div className={styles.stepList}>
          {steps.map(({ title, description, icon: Icon }, index) => (
            <article className={styles.step} key={title}>
              <div className={styles.stepIcon}>
                <Icon aria-hidden="true" />
              </div>
              <div>
                <span className={styles.stepNumber}>{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Index;

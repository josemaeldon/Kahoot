import React, { useContext } from "react";
import { GameContext } from "../pages/create";
import styles from "../styles/Options.module.css";
import { FiClock, FiInfo } from "react-icons/fi";

function Options() {
  const { game, setGame, questionNumber } = useContext(GameContext);
  const question = game.questions[questionNumber];

  return (
    <aside className={styles.container}>
      <h2>Configurações</h2>
      <label className={styles.setting}>
        <span>
          <FiClock aria-hidden="true" />
          Tempo
        </span>
        <select
          value={question.time}
          onChange={(event) => {
            const time = Number(event.target.value);
            setGame((current) => ({
              ...current,
              questions: current.questions.map((item, index) =>
                index === questionNumber ? { ...item, time } : item
              ),
            }));
          }}
        >
          {[15, 30, 45, 60, 90].map((time) => (
            <option key={time} value={time}>
              {time} segundos
            </option>
          ))}
        </select>
      </label>
      <div className={styles.helper}>
        <FiInfo aria-hidden="true" />
        <p>Selecione a resposta correta antes de salvar.</p>
      </div>
    </aside>
  );
}

export default Options;

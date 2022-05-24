import React, { useContext } from "react";
import { GameContext } from "../pages/create";
import styles from "../styles/Questions.module.css";

function Questions() {
  const { game, setGame, questionNumber, setQuestionNumber } =
    useContext(GameContext);
  return (
    <div className={`${styles.container}`}>
      <p>Hey</p>
    </div>
  );
}

export default Questions;

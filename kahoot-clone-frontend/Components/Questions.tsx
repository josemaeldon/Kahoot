import React, { useContext } from "react";
import { FiCopy, FiPlus, FiTrash2, FiAlertCircle } from "react-icons/fi";
import type { db } from "../kahoot";
import { GameContext } from "../pages/create";
import styles from "../styles/Questions.module.css";

function Questions() {
  const {
    game,
    setGame,
    questionNumber,
    setQuestionNumber,
    formErrors,
    validateForm,
    validateFormAndIgnoreError,
  } = useContext(GameContext);

  function duplicateQuestion(questionIndex: number) {
    const questionCopy = structuredClone(game.questions[questionIndex]);
    const nextGame = {
      ...game,
      questions: [
        ...game.questions.slice(0, questionIndex + 1),
        questionCopy,
        ...game.questions.slice(questionIndex + 1),
      ],
    };
    setGame(nextGame);
    validateForm(nextGame);
    setQuestionNumber(questionIndex + 1);
  }

  function deleteQuestion(questionIndex: number) {
    if (game.questions.length === 1) return;
    const nextQuestions = game.questions.filter(
      (_, index) => index !== questionIndex
    );
    const nextGame = { ...game, questions: nextQuestions };
    setGame(nextGame);
    validateForm(nextGame);
    setQuestionNumber((current) =>
      Math.min(current, nextQuestions.length - 1)
    );
  }

  function addQuestion() {
    const newQuestion: db.Question = {
      choices: ["", "", "", ""],
      correctAnswer: 0,
      question: "",
      image: null,
      time: 15,
    };
    const nextGame = {
      ...game,
      questions: [...game.questions, newQuestion],
    };
    const lastQuestion = nextGame.questions.length - 1;
    setGame(nextGame);
    setQuestionNumber(lastQuestion);
    validateFormAndIgnoreError(nextGame, lastQuestion);
  }

  return (
    <aside className={styles.container} aria-label="Perguntas do quiz">
      <div className={styles.railHeading}>
        <strong>
          {game.questions.length}{" "}
          {game.questions.length === 1 ? "pergunta" : "perguntas"}
        </strong>
      </div>
      <div className={styles.questionList}>
        {game.questions.map((question, index) => {
          const selected = index === questionNumber;
          const errors = formErrors?.questionErrors[index];
          const hasError =
            errors &&
            !errors.ignoreErrors &&
            (errors.choicesRequiredError ||
              errors.correctChoiceError ||
              errors.questionBlankError);

          return (
            <article
              key={index}
              className={`${styles.questionBox} ${
                selected ? styles.selected : ""
              }`}
            >
              <button
                type="button"
                className={styles.questionSelect}
                onClick={() => {
                  setQuestionNumber(index);
                  validateForm(game);
                }}
                aria-current={selected ? "true" : undefined}
              >
                <span className={styles.questionNumber}>{index + 1}</span>
                <span className={styles.questionLabel}>Quiz</span>
                {hasError && (
                  <FiAlertCircle
                    className={styles.warning}
                    aria-label={`A pergunta ${index + 1} precisa ser revisada`}
                  />
                )}
              </button>
              <div className={styles.preview}>
                <p>{question.question || "Nova pergunta"}</p>
                {question.image && (
                  <img
                    className={styles.previewImage}
                    src={question.image}
                    alt=""
                  />
                )}
                <div className={styles.previewGrid} aria-hidden="true">
                  {question.choices.map((choice, choiceIndex) => (
                    <span
                      key={choiceIndex}
                      data-filled={choice.trim() !== ""}
                      data-correct={
                        question.correctAnswer === choiceIndex &&
                        choice.trim() !== ""
                      }
                    />
                  ))}
                </div>
              </div>
              <div className={styles.questionActions}>
                <button
                  type="button"
                  aria-label={`Duplicar pergunta ${index + 1}`}
                  onClick={() => duplicateQuestion(index)}
                >
                  <FiCopy aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir pergunta ${index + 1}`}
                  disabled={game.questions.length === 1}
                  onClick={() => deleteQuestion(index)}
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.addButton}
        onClick={addQuestion}
      >
        <FiPlus aria-hidden="true" />
        Adicionar pergunta
      </button>
    </aside>
  );
}

export default Questions;

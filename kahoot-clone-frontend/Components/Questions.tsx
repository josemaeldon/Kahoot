import React, { useContext } from "react";
import { BsTrash } from "react-icons/bs";
import { MdContentCopy } from "react-icons/md";
import { GameContext } from "../pages/create";
import styles from "../styles/Questions.module.css";

function Questions() {
  const { game, setGame, questionNumber, setQuestionNumber } =
    useContext(GameContext);

  function duplicateHandler(questionIndex) {
    setGame((game) => {
      const gameCopy = JSON.parse(JSON.stringify(game));
      const questionCopy = JSON.parse(
        JSON.stringify(gameCopy.questions[questionIndex])
      );
      gameCopy.questions.splice(questionIndex + 1, 0, questionCopy);
      console.log(game, gameCopy);
      return gameCopy;
    });
    setQuestionNumber(questionIndex + 1);
  }
  function deleteHandler(questionIndex) {
    //User shouldn't delete the only question in the kahoot
    //Todo: Modal popup
    console.log(game.questions.length);
    if (game.questions.length === 1) return;

    setGame((game) => {
      const gameCopy = JSON.parse(JSON.stringify(game));
      gameCopy.questions.splice(questionIndex, 1);

      //Makes sure that the question the user is on isn't out of bounds after an element is deleted
      if (gameCopy.questions.length - 1 < questionNumber)
        setQuestionNumber(gameCopy.questions.length - 1);

      return gameCopy;
    });
  }
  function addQuestionHandler() {}

  return (
    <div className={`${styles.container}`}>
      <div className={`${styles.innerContainer}`}>
        {game.questions.map((question, index) => {
          return (
            <div key={Math.random()}>
              <div
                className={`${styles.questionBox} ${
                  index === questionNumber
                    ? `${styles.questionHighlighted}`
                    : ""
                }`}
                onClick={() => {
                  setQuestionNumber(index);
                }}
              >
                <section className={`${styles.questionHeader}`}>
                  <div>
                    <span>{`${index + 1}`}</span>
                  </div>
                  <div>
                    <span>Quiz</span>
                  </div>
                </section>
                <div className={`${styles.questionContainer}`}>
                  <section className={`${styles.questionActions}`}>
                    <MdContentCopy
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateHandler(index);
                      }}
                    ></MdContentCopy>
                    <BsTrash
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHandler(index);
                      }}
                    ></BsTrash>
                  </section>
                  <section className={`${styles.questionPreview}`}></section>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Questions;

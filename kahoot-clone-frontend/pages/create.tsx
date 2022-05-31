import React, { useState } from "react";
import styles from "../styles/create.module.css";
import Questions from "../components/Questions";
import Image from "next/image";
import Editor from "../components/Editor";
import Options from "../components/Options";
import type { db } from "../kahoot";
import useUser from "@lib/useUser";

function Header({
  game,
  setGame,
}: {
  game: db.KahootGame;
  setGame: React.Dispatch<React.SetStateAction<db.KahootGame>>;
}) {
  return (
    <div className={`${styles.container}`}>
      <div className={`${styles.flex1}`}>
        <Image
          src={"/kahootLogo.svg"}
          width={"96px"}
          height={"32.72px"}
          alt="Kahoot Logo"
        ></Image>
        <input
          className={`${styles.titleInput}`}
          type={"text"}
          placeholder="Enter Kahoot title..."
          value={game.title}
          onChange={(e) => {
            setGame((game) => {
              const gameCopy = { ...game }; //Shallow copy
              gameCopy.title = e.target.value;
              return gameCopy;
            });
          }}
        ></input>
      </div>
      <div>
        <button type="button" className={`${styles.exitButton}`}>
          Exit
        </button>
        <button type="button" className={`${styles.saveButton}`}>
          Save
        </button>
      </div>
    </div>
  );
}

interface GameContext {
  game: db.KahootGame;
  setGame: React.Dispatch<React.SetStateAction<db.KahootGame>>;
  questionNumber: number;
  setQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
  formErrors: FormErrorReport;
  validateForm: (game: db.KahootGame) => void;
  validateFormAndIgnoreError: (
    game: db.KahootGame,
    questionIndex: number
  ) => void;
}

interface QuestionError {
  /** The correctAnswer has to be on an answer choice that's not blank */
  correctChoiceError: boolean;
  /** Question cannot be left blank */
  questionBlankError: boolean;
  /** Answer choices with indices 0 and 1, must be filled */
  choicesRequiredError: boolean;

  /** Should the question's errors be ignored?
   * This is useful for the situation where the question has not been edited yet,
   * because you don't want to complain that there's an error before the user has
   * made any edits to the question  */
  ignoreErrors: boolean;
}
interface FormErrorReport {
  titleBlankError: boolean; //Title cannot be blank
  questionErrors: QuestionError[];
}

export const GameContext = React.createContext<GameContext>(null);

const defaultGame: db.KahootGame = {
  author: "",
  id: "",
  title: "",
  questions: [
    { correctAnswer: 0, choices: ["", "", "", ""], question: "", time: 30 },
  ],
};

function getFormErrors(game: db.KahootGame) {
  //Question with indexes 0 and 1, must be filled. (cannot be an empty string)
  //The correctAnswer has to be on a filled question
  const formErrorReport: FormErrorReport = {
    titleBlankError: false,
    questionErrors: [],
  };

  //titleBlankError check
  if (game.title === "") formErrorReport.titleBlankError = true;

  //questionErrors check
  game.questions.forEach((question) => {
    const questionError: QuestionError = {
      choicesRequiredError: false,
      correctChoiceError: false,
      questionBlankError: false,
      ignoreErrors: false,
    };
    if (question.choices[0] === "" || question.choices[1] === "")
      questionError.choicesRequiredError = true;
    if (question.choices[question.correctAnswer] === "")
      questionError.correctChoiceError = true;
    if (question.question === "") questionError.questionBlankError = true;
    formErrorReport.questionErrors.push(questionError);
  });
  return formErrorReport;
}

function Create() {
  const [game, setGame] = useState<db.KahootGame>(defaultGame);

  //null is used as the default value. All components take "null" to mean
  //that they should not display any form errors. This is to prevent errors from
  //being shown on first render (bad user experience)
  const [formErrors, setFormErrors] = useState<FormErrorReport | null>(null);

  const [questionNumber, setQuestionNumber] = useState(0);

  const { loggedIn, user } = useUser();
  if (!loggedIn) {
    return <></>;
  }

  function validateForm(game: db.KahootGame) {
    const formErrors = getFormErrors(game);
    setFormErrors(formErrors);
  }

  function validateFormAndIgnoreError(game, questionIndex: number) {
    const formErrors = getFormErrors(game);
    formErrors.questionErrors[questionIndex].ignoreErrors = true;
    setFormErrors(formErrors);
  }

  return (
    <div className={`vh100 ${styles.containerLayout}`}>
      <Header game={game} setGame={setGame}></Header>
      <div
        className={`${styles.layout} ${styles.lightGrey} ${styles.flexChild}`}
      >
        <GameContext.Provider
          value={{
            game,
            setGame,
            questionNumber,
            setQuestionNumber,
            formErrors,
            validateForm,
            validateFormAndIgnoreError,
          }}
        >
          <Questions></Questions>
          <Editor></Editor>
          <Options></Options>
        </GameContext.Provider>
      </div>
    </div>
  );
}

export default Create;

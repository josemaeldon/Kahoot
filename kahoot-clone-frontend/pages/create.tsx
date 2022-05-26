import React, { useState } from "react";
import styles from "../styles/create.module.css";
import Questions from "../Components/Questions";
import Image from "next/image";
import Editor from "../Components/Editor";
import Options from "../Components/Options";
import type { db } from "../kahoot";

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
}

export const GameContext = React.createContext<GameContext>(null);

const defaultGame: db.KahootGame = {
  author: "",
  id: "",
  title: "",
  questions: [
    { correctAnswer: 0, choices: ["", "", "", ""], question: "", time: 15 },
  ],
};

function Create() {
  const [game, setGame] = useState<db.KahootGame>(defaultGame);
  const [questionNumber, setQuestionNumber] = useState(0);
  return (
    <div className={`vh100 ${styles.containerLayout}`}>
      <Header game={game} setGame={setGame}></Header>
      <div
        className={`${styles.layout} ${styles.lightGrey} ${styles.flexChild}`}
      >
        <GameContext.Provider
          value={{ game, setGame, questionNumber, setQuestionNumber }}
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

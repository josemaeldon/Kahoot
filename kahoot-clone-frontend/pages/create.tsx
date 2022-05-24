import React, { useState } from "react";
import styles from "../styles/create.module.css";
import Questions from "../Components/Questions";
import Image from "next/image";
import Editor from "../Components/Editor";
import Options from "../Components/Options";

interface KahootGame {
  id: string; //uuid of the game
  author: string; //uuid of the author
  title: string;
  questions: Question[];
}

interface Question {
  question: string;
  choices: string[];
  correctAnswer: number;
}

function Header() {
  return (
    <div className={`${styles.container}`}>
      <div>
        <Image
          src={"/kahootLogo.svg"}
          width={"96px"}
          height={"32.72px"}
          alt="Kahoot Logo"
        ></Image>
        <input type={"text"} placeholder="Enter Kahoot title..."></input>
      </div>
      <div>
        <button type="button">Exit</button>
        <button type="button">Save</button>
      </div>
    </div>
  );
}

export const GameContext = React.createContext(null);

function Create() {
  const [game, setGame] = useState<KahootGame>();
  const [questionNumber, setQuestionNumber] = useState(0);
  return (
    <div className={`vh100 ${styles.containerLayout}`}>
      <Header></Header>
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

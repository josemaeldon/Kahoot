import React from "react";
import styles from "../styles/create.module.css";

import Image from "next/image";

interface KahootGame {
  id: string;
  author: string;
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

function Create() {
  return (
    <div className={`${styles.container} vh100`}>
      <Header></Header>
      <div></div>
    </div>
  );
}

export default Create;

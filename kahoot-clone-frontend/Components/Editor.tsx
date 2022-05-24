import React, { useContext } from "react";
import { GameContext } from "../pages/create";
import styles from "../styles/Editor.module.css";
import {
  BsFillTriangleFill,
  BsFillSquareFill,
  BsFillCircleFill,
  BsFillDiamondFill,
} from "react-icons/bs";

function Editor() {
  const { game, setGame, questionNumber, setQuestionNumber } =
    useContext(GameContext);
  return (
    <div className={`${styles.container}`}>
      <p
        contentEditable="true"
        className={`${styles.question}`}
        placeholder="Question..."
      >
        Question
      </p>
      <div>
        <div className={`${styles.grid}`}>
          <div>
            <span>
              <BsFillTriangleFill></BsFillTriangleFill>
            </span>
            <div>
              <p contentEditable="true"></p>
            </div>
          </div>
          <div>
            <span>
              <BsFillSquareFill></BsFillSquareFill>
            </span>
            <div>
              <p contentEditable="true"></p>
            </div>
          </div>
          <div>
            <span>
              <BsFillCircleFill></BsFillCircleFill>
            </span>
            <div>
              <p contentEditable="true"></p>
            </div>
          </div>
          <div>
            <span>
              <BsFillSquareFill
                style={{ transform: "rotate(45deg)" }}
              ></BsFillSquareFill>
            </span>
            <div>
              <p contentEditable="true"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;

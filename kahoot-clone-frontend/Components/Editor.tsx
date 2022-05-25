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
          <div className={`${styles.wrapper}`}>
            <span>
              <BsFillTriangleFill></BsFillTriangleFill>
            </span>
            <div>
              <p
                contentEditable="true"
                placeholder="Answer 1"
                className={`${styles.answer}`}
              ></p>
            </div>
          </div>
          <div className={`${styles.wrapper}`}>
            <span>
              <BsFillSquareFill></BsFillSquareFill>
            </span>
            <div>
              <p
                contentEditable="true"
                className={`${styles.answer}`}
                placeholder="Answer 2"
              ></p>
            </div>
          </div>
          <div className={`${styles.wrapper}`}>
            <span>
              <BsFillCircleFill></BsFillCircleFill>
            </span>
            <div>
              <p
                contentEditable="true"
                className={`${styles.answer}`}
                placeholder="Answer 3 (optional)"
              ></p>
            </div>
          </div>
          <div className={`${styles.wrapper}`}>
            <span>
              <BsFillSquareFill
                style={{ transform: "rotate(45deg)" }}
              ></BsFillSquareFill>
            </span>
            <div>
              <p
                contentEditable="true"
                className={`${styles.answer}`}
                placeholder="Answer 4 (optional)"
              ></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;

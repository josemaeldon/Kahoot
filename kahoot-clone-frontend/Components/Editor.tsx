import React, { useContext, useEffect, useRef } from "react";
import { GameContext } from "../pages/create";
import styles from "../styles/Editor.module.css";
import {
  BsFillTriangleFill,
  BsFillSquareFill,
  BsFillCircleFill,
} from "react-icons/bs";
import type { db } from "../kahoot";

function replaceCaret(el: HTMLElement) {
  // Place the caret at the end of the element
  const target = document.createTextNode("");
  el.appendChild(target);
  // do not move caret if element was not focused
  const isTargetFocused = document.activeElement === el;
  if (target !== null && target.nodeValue !== null && isTargetFocused) {
    var sel = window.getSelection();
    if (sel !== null) {
      var range = document.createRange();
      range.setStart(target, target.nodeValue.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (el instanceof HTMLElement) el.focus();
  }
}

function Editor() {
  const { game, setGame, questionNumber, setQuestionNumber } =
    useContext(GameContext);

  function answerInputHandler(answerIndex: number) {
    return (e: React.FormEvent<HTMLParagraphElement>) => {
      e.preventDefault();
      const gameCopy = { ...game };
      gameCopy.questions[questionNumber].choices[answerIndex] =
        e.currentTarget.innerText;
      console.log(e.currentTarget.innerText);
      setGame({ ...game });
    };
  }

  function questionInputHandler(e: React.FormEvent<HTMLParagraphElement>) {
    e.preventDefault();
    const gameCopy = { ...game };
    gameCopy.questions[questionNumber].question = e.currentTarget.innerText;
    console.log(e.currentTarget.innerText);
    setGame({ ...game });
  }

  const question = useRef();
  const a1 = useRef();
  const a2 = useRef();
  const a3 = useRef();
  const a4 = useRef();

  useEffect(() => {
    replaceCaret(question.current);
    replaceCaret(a1.current);
    replaceCaret(a2.current);
    replaceCaret(a3.current);
    replaceCaret(a4.current);
  });

  return (
    <div className={`${styles.container}`}>
      <p
        contentEditable="true"
        className={`${styles.question}`}
        placeholder="Question..."
        ref={question}
        onInput={questionInputHandler}
        suppressContentEditableWarning
      >
        {game.questions[questionNumber].question}
      </p>
      <div>
        <div className={`${styles.grid}`}>
          <div className={`${styles.wrapper}`}>
            <span className={`${styles.shapeContainer}`}>
              <BsFillTriangleFill></BsFillTriangleFill>
            </span>
            <div className={`${styles.answerContainer}`}>
              <p
                contentEditable="true"
                placeholder="Answer 1"
                className={`${styles.answer}`}
                onInput={answerInputHandler(0)}
                suppressContentEditableWarning
                ref={a1}
              >
                {game.questions[questionNumber].choices[0]}
              </p>
            </div>
          </div>
          <div className={`${styles.wrapper}`}>
            <span className={`${styles.shapeContainer}`}>
              <BsFillSquareFill></BsFillSquareFill>
            </span>
            <div className={`${styles.answerContainer}`}>
              <p
                contentEditable="true"
                className={`${styles.answer}`}
                placeholder="Answer 2"
                onInput={answerInputHandler(1)}
                suppressContentEditableWarning
                ref={a2}
              >
                {game.questions[questionNumber].choices[1]}
              </p>
            </div>
          </div>
          <div className={`${styles.wrapper}`}>
            <span className={`${styles.shapeContainer}`}>
              <BsFillCircleFill></BsFillCircleFill>
            </span>
            <div className={`${styles.answerContainer}`}>
              <p
                contentEditable="true"
                className={`${styles.answer}`}
                placeholder="Answer 3 (optional)"
                onInput={answerInputHandler(2)}
                suppressContentEditableWarning
                ref={a3}
              >
                {game.questions[questionNumber].choices[2]}
              </p>
            </div>
          </div>
          <div className={`${styles.wrapper}`}>
            <span className={`${styles.shapeContainer}`}>
              <BsFillSquareFill
                style={{ transform: "rotate(45deg)" }}
              ></BsFillSquareFill>
            </span>
            <div className={`${styles.answerContainer}`}>
              <p
                contentEditable="true"
                className={`${styles.answer}`}
                placeholder="Answer 4 (optional)"
                onInput={answerInputHandler(3)}
                suppressContentEditableWarning
                ref={a4}
              >
                {game.questions[questionNumber].choices[3]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;

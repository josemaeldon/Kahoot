import React, { useContext, useEffect, useRef } from "react";
import { GameContext } from "../pages/create";
import styles from "../styles/Editor.module.css";
import {
  BsFillTriangleFill,
  BsFillSquareFill,
  BsFillCircleFill,
} from "react-icons/bs";
import { FaCheck } from "react-icons/fa";
import type { db } from "../kahoot";

// Função para substituir o caret ao final do campo de texto
function replaceCaret(el: HTMLElement) {
  const target = document.createTextNode("");
  el.appendChild(target);
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

// Componente de Checkbox com círculo
function CheckboxCircle({
  onClick,
  checked,
}: {
  onClick: React.MouseEventHandler<HTMLDivElement>;
  checked: boolean;
}) {
  return (
    <div
      className={`${styles.checkBoxOuter} ${checked ? styles.green : ""}`}
      onClick={onClick}
    >
      <div className={`${styles.checkBoxInner}`}>
        <FaCheck className={`${!checked ? styles.hidden : ""}`}></FaCheck>
      </div>
    </div>
  );
}

function Editor() {
  const {
    game,
    setGame,
    questionNumber,
    setQuestionNumber,
    formErrors,
    validateForm,
  } = useContext(GameContext);

  const questionError =
    formErrors !== null &&
    formErrors.questionErrors[questionNumber] !== undefined &&
    formErrors.questionErrors[questionNumber].ignoreErrors !== true &&
    formErrors.questionErrors[questionNumber];

  const questionBlankError =
    formErrors !== null &&
    formErrors.questionErrors[questionNumber] !== undefined &&
    formErrors.questionErrors[questionNumber].ignoreErrors !== true &&
    formErrors.questionErrors[questionNumber].questionBlankError;

  // Função para lidar com a alteração da categoria
  function categoryInputHandler(e: React.FormEvent<HTMLParagraphElement>) {
    e.preventDefault();
    const gameCopy = { ...game };
    gameCopy.questions[questionNumber].category = e.currentTarget.innerText;
    setGame({ ...game });

    if (questionError.categoryBlankError) validateForm({ ...game });
  }

  // Função para lidar com a alteração das respostas
  function answerInputHandler(answerIndex: number) {
    return (e: React.FormEvent<HTMLParagraphElement>) => {
      e.preventDefault();
      const gameCopy = { ...game };
      gameCopy.questions[questionNumber].choices[answerIndex] =
        e.currentTarget.innerText;
      setGame({ ...game });

      if (questionError.choicesRequiredError) validateForm({ ...game });
    };
  }

  function onCheckboxClickHandler(index: number) {
    return () => {
      const gameCopy = { ...game };
      gameCopy.questions[questionNumber].correctAnswer = index;
      setGame(gameCopy);

      if (questionError.correctChoiceError) validateForm(gameCopy);
    };
  }

  function questionInputHandler(e: React.FormEvent<HTMLParagraphElement>) {
    e.preventDefault();
    const gameCopy = { ...game };
    gameCopy.questions[questionNumber].question = e.currentTarget.innerText;
    setGame({ ...game });

    if (questionError.questionBlankError) validateForm({ ...game });
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

  const q0Empty = game.questions[questionNumber].choices[0] === "";
  const q1Empty = game.questions[questionNumber].choices[1] === "";
  const q2Empty = game.questions[questionNumber].choices[2] === "";
  const q3Empty = game.questions[questionNumber].choices[3] === "";
  const q0Checked = game.questions[questionNumber].correctAnswer === 0;
  const q1Checked = game.questions[questionNumber].correctAnswer === 1;
  const q2Checked = game.questions[questionNumber].correctAnswer === 2;
  const q3Checked = game.questions[questionNumber].correctAnswer === 3;

  return (
    <div className={`${styles.container}`}>
      <p
        contentEditable="true"
        className={`${styles.question} ${
          questionBlankError ? styles.lightRed : ""
        }`}
        placeholder="Sua pergunta aqui..."
        ref={question}
        onInput={questionInputHandler}
        suppressContentEditableWarning
      >
        {game.questions[questionNumber].question}
      </p>

      {/* Adicionando campo de categoria abaixo da pergunta */}
      <p
        contentEditable="true"
        className={`${styles.category} ${
          questionError.categoryBlankError ? styles.lightRed : ""
        }`}
        placeholder="Categoria da pergunta"
        onInput={categoryInputHandler}
        suppressContentEditableWarning
      >
        {game.questions[questionNumber].category}
      </p>

      <div>
        <div className={`${styles.grid}`}>
          <div
            className={`${styles.wrapper} ${
              !q0Empty ? `${styles.red}` : `${styles.white}`
            }`}
          >
            <span className={`${styles.shapeContainer} ${styles.red}`}>
              <BsFillTriangleFill></BsFillTriangleFill>
            </span>
            <div className={`${styles.answerContainer}`}>
              <p
                contentEditable="true"
                placeholder="Resposta 1"
                className={`${styles.answer} ${
                  !q0Empty ? styles.whiteText : ""
                }`}
                onInput={answerInputHandler(0)}
                suppressContentEditableWarning
                ref={a1}
              >
                {game.questions[questionNumber].choices[0]}
              </p>
            </div>
            {!q0Empty && (
              <CheckboxCircle
                onClick={onCheckboxClickHandler(0)}
                checked={q0Checked}
              ></CheckboxCircle>
            )}
          </div>
          {/* Adicionando o restante das respostas */}
        </div>
      </div>
    </div>
  );
}

export default Editor;

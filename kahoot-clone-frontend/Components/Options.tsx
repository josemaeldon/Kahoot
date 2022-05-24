import React, { useContext, useState } from "react";
import { GameContext } from "../pages/create";
import styles from "../styles/Options.module.css";
import {
  MdOutlineArrowForwardIos,
  MdOutlineArrowBackIos,
} from "react-icons/md";

function Options() {
  const { game, setGame, questionNumber, setQuestionNumber } =
    useContext(GameContext);
  const [open, setOpen] = useState(true);
  return (
    <div
      className={`${styles.container} ${
        open ? styles.containerOpen : styles.containerClosed
      }`}
    >
      <div
        className={`${styles.toggleSwitch}`}
        onClick={() => {
          setOpen(!open);
        }}
      >
        {open ? (
          <MdOutlineArrowForwardIos></MdOutlineArrowForwardIos>
        ) : (
          <MdOutlineArrowBackIos></MdOutlineArrowBackIos>
        )}
      </div>
    </div>
  );
}

export default Options;

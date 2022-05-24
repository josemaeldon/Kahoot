import React from "react";
import styles from "../styles/create.module.css";

import Image from "next/image";

function Header() {
  return (
    <div className={`${styles.container}`}>
      <Image
        src={"/kahootLogo.svg"}
        width={"96px"}
        height={"32.72px"}
        alt="Kahoot Logo"
      ></Image>
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

import Header from "../Components/header";
import styles from "../styles/index.module.css";
import Image from "next/image";
import GameButton from "../Components/GameButton";
import Link from "next/link";

function index() {
  return (
    <div className={`vh100 ${styles.lightGrey} ${styles.center}`}>
      <div className={`${styles.card}`}>
        <div>
          <Image
            src={"/kahootLogo.svg"}
            alt="Kahoot Logo"
            layout="fill"
          ></Image>
        </div>
        <GameButton
          backgroundStyle={{
            backgroundColor: "rgb(14,78,154)",
          }}
          foregroundStyle={{
            backgroundColor: "rgb(19,104,206)",
            padding: "10px 16px 10px 16px",
          }}
        >
          <Link href={"/play"}>Play</Link>
        </GameButton>
        <GameButton
          backgroundStyle={{
            backgroundColor: "rgb(14,78,154)",
          }}
          foregroundStyle={{
            backgroundColor: "rgb(19,104,206)",
            padding: "10px 16px 10px 16px",
          }}
        >
          <Link href={"/create"}>Create</Link>
        </GameButton>
      </div>
    </div>
  );
}

export default index;

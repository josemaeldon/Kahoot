import styles from "../styles/Header.module.css";
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

export default Header;

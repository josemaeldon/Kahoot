import styles from "../styles/Play.module.css";

function Play() {
  return (
    <div className={`${styles.backdrop}`}>
      <div className={`${styles.gameBox}`}>
        <p className={`${styles.logo}`}>Kahoot!</p>
        <div className={`${styles.gameInput}`}>
          <input
            type="text"
            placeholder="Game PIN"
            className={`${styles.gameInputPin}`}
          ></input>
          <button className={`${styles.gameButton}`}>
            <span>Enter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Play;

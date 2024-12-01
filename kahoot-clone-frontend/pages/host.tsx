import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import styles from "@styles/host.module.css";
import { IoMdPerson } from "react-icons/io";
import GameButton from "@components/GameButton";
import type { action, db, HostEvent, rustServerQuestion } from "kahoot";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "./api/getOneGame";
import qStyles from "@styles/DisplayQuestion.module.css";
import {
  BsFillCircleFill,
  BsFillSquareFill,
  BsFillTriangleFill,
} from "react-icons/bs";
import { FaCheck } from "react-icons/fa";
import { Spinner, SSRProvider } from "react-bootstrap";
import Image from "next/image";

const HostContext = React.createContext<Context>(null);

type Players = { username: string; points: number }[];

interface Context {
  roomId: number;
  game: db.KahootGame;
  socket: WebSocket;
  players: Players;
  setPlayers: React.Dispatch<React.SetStateAction<Players>>;
  setPhase: React.Dispatch<
    React.SetStateAction<"lobby" | "questions" | "leaderboard">
  >;
}

function JoinHeader() {
  const { roomId } = useContext(HostContext);
  const roomString = roomId + "";
  const r1 = roomString.slice(0, 3);
  const r2 = roomString.slice(3, 6);
  const r3 = roomString.slice(6);

  const qrCodeImageUrl =
    "https://raw.githubusercontent.com/josemaeldon/Kahoot/8b1c87cd30fe3e7603c168fdf762fc70984e3c08/kahoot-clone-frontend/pages/Captura%20de%20Tela%202024-12-01%20a%CC%80s%2015.16.22.png";

  return (
    <div className={`${styles.darkBackground}`}>
      <div className={`${styles.outerContainer}`}>
        <div className={`${styles.playHeader}`}>
          <p>Acesse kahoot.cloudbr.app</p>
          <img src={qrCodeImageUrl} alt="QR Code para acessar o jogo" />
        </div>
        <div className={`${styles.pinHeader}`}>
          <p>Game Pin:</p>
          <p>{`${r1} ${r2} ${r3}`}</p>
        </div>
      </div>
    </div>
  );
}

function Lobby() {
  const { players, setPlayers, setPhase } = useContext(HostContext);

  useEffect(() => {
    const aborter = new AbortController();
    const socket = new WebSocket("wss://kahoot-server.cloudbr.app/ws");

    socket.addEventListener("message", function lobbyHandler(e) {
      const hostEvent = JSON.parse(e.data) as HostEvent.Event;
      switch (hostEvent.type) {
        case "userJoined":
          setPlayers((players) => {
            const copy = [...players];
            copy.push({ username: hostEvent.username, points: 0 });
            return copy;
          });
          break;
        case "userLeft":
          setPlayers((players) => {
            const copy = [...players];
            const indexToDelete = copy.findIndex((player) => player.username === hostEvent.username);
            if (indexToDelete !== -1) copy.splice(indexToDelete, 1);
            return copy;
          });
          break;
        default:
          break;
      }
    });

    return () => {
      socket.close();
      aborter.abort();
    };
  }, []);

  return (
    <div className={`${styles.lobby}`}>
      <div className={`${styles.lobbyHeaderContainer}`}>
        <div className={`${styles.lobbyPeople}`}>
          <IoMdPerson />
          <span>{players.length}</span>
        </div>
        <div style={{ fontSize: "32px", fontWeight: "bold" }}>
          <span>Kahoot!</span>
        </div>
        <div style={{ position: "relative", top: "10px" }}>
          <GameButton
            onClick={(e) => {
              if (players.length !== 0) {
                setPhase("questions");
              }
              e.preventDefault();
            }}
            backgroundStyle={{
              backgroundColor: "lightgray",
              color: "black",
              fontSize: "19px",
            }}
            foregroundStyle={{
              backgroundColor: players.length === 0 ? "lightgray" : "white",
              cursor: players.length === 0 ? "not-allowed" : "pointer",
              padding: "3px 13px 3px 13px",
            }}
          >
            Start
          </GameButton>
        </div>
      </div>
      <div className={`${styles.lobbyUserContainer}`}>
        {players.map((player) => (
          <span key={player.username} className={`${styles.lobbyUser}`}>
            {player.username}
          </span>
        ))}
      </div>
    </div>
  );
}

interface Props {
  question: rustServerQuestion;
  showAnswer: boolean;
  nextScreenHandler: () => void;
  timeLeft: number;
  answered: number;
}

function CheckboxCircle({ checked }: { checked: boolean }) {
  return (
    <div className={`${qStyles.checkBoxOuter} ${checked ? qStyles.green : ""}`}>
      <div className={`${qStyles.checkBoxInner}`}>
        <FaCheck className={`${!checked ? qStyles.hidden : ""}`} />
      </div>
    </div>
  );
}

function QuestionDisplay({
  question,
  showAnswer,
  nextScreenHandler,
  answered,
  timeLeft,
}: Props) {
  return (
    <section>
      <div className={qStyles.gameButtonFlex}>
        <GameButton
          onClick={nextScreenHandler}
          backgroundStyle={{
            backgroundColor: "lightgray",
            color: "black",
            fontSize: "19px",
          }}
          foregroundStyle={{
            backgroundColor: "rgb(244,244,244)",
            cursor: "pointer",
            padding: "3px 13px 3px 13px",
          }}
        >
          Next
        </GameButton>
      </div>
      <div className={`${qStyles.container}`}>
        <p className={`${qStyles.question}`} suppressContentEditableWarning>
          {question.question}
        </p>
        <section className={`${styles.middleContainer}`}>
          <div className={`${styles.timerBubble}`}>{timeLeft}</div>
          <div className={`${styles.imageContainer}`}>
            <Image src={"/kahootBalls.gif"} layout="fill" objectFit="contain" />
          </div>
          <div className={`${styles.answerNotifier}`}>{`${answered} Answers`}</div>
        </section>
        <div className={`${qStyles.grid}`}>
          {question.choices.map((choice, index) => (
            <div key={index} className={`${qStyles.wrapper} ${qStyles[choice.color]}`}>
              <span className={`${qStyles.shapeContainer} ${qStyles[choice.color]}`}>
                <BsFillTriangleFill />
              </span>
              <div className={`${qStyles.answerContainer}`}>
                <p className={`${qStyles.answer} ${qStyles.whiteText}`}>{choice.text}</p>
              </div>
              {showAnswer && question.answer === index && <CheckboxCircle checked={true} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Leaderboard({ nextScreenHandler }) {
  const { players } = useContext(HostContext);
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className={`${styles.leaderboardContainer}`}>
      <p className={`${styles.leaderboardHeader}`}>
        Leaderboard:
        <GameButton
          onClick={nextScreenHandler}
          backgroundStyle={{
            backgroundColor: "lightgray",
            color: "black",
            fontSize: "19px",
          }}
          foregroundStyle={{
            backgroundColor: "white",
            cursor: "pointer",
            padding: "3px 13px 3px 13px",
          }}
        >
          Next
        </GameButton>
      </p>
      <div className={`${styles.leaderboardBody}`}>
        {sortedPlayers.map((player) => (
          <div key={player.username} className={`${styles.leaderboardPlayer}`}>
            {player.username}: {player.points}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Host() {
  const { roomId, game } = useContext(HostContext);
  const [players, setPlayers] = useState<Players>([]);
  const [phase, setPhase] = useState<"lobby" | "questions" | "leaderboard">(
    "lobby"
  );
  const [question, setQuestion] = useState<rustServerQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const router = useRouter();

  useLayoutEffect(() => {
    if (game) {
      setQuestion(game.currentQuestion);
      setPlayers([]);
      setPhase("lobby");
    }
  }, [game]);

  const nextScreenHandler = () => {
    if (phase === "lobby") {
      setPhase("questions");
    } else if (phase === "questions") {
      setPhase("leaderboard");
    }
  };

  return (
    <div className={`${styles.page}`}>
      <SSRProvider>
        <HostContext.Provider
          value={{
            roomId,
            game,
            socket: new WebSocket("wss://kahoot-server.cloudbr.app/ws"),
            players,
            setPlayers,
            setPhase,
          }}
        >
          {phase === "lobby" && <Lobby />}
          {phase === "questions" && question && (
            <QuestionDisplay
              question={question}
              showAnswer={showAnswer}
              nextScreenHandler={nextScreenHandler}
              answered={answered}
              timeLeft={timeLeft}
            />
          )}
          {phase === "leaderboard" && <Leaderboard nextScreenHandler={nextScreenHandler} />}
        </HostContext.Provider>
      </SSRProvider>
    </div>
  );
}

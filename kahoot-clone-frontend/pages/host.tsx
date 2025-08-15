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
    "https://raw.githubusercontent.com/josemaeldon/Kahoot/423004878480c915ac5f049fc39f656fce431993/kahoot-clone-frontend/pages/qr_karoot.png";

  return (
    <div className={`${styles.darkBackground}`}>
      <div className={`${styles.outerContainer}`}>
        <div className={`${styles.playHeader}`}>
          <p>Acesse kahoot.cloudbr.app/play ou pelo QrCode</p>
          <p>
            <a href="https://kahoot.cloudbr.app">Recomeçar</a>
          </p>
        </div>
        <div className={`${styles.pinHeader}`}>
          <p>Game Pin:</p>
          <p>{`${r1} ${r2} ${r3}`}</p>
          <p>
            <img src={qrCodeImageUrl} alt="QR Code para acessar o jogo" />
          </p>
        </div>
      </div>
    </div>
  );
}

function Lobby() {
  const { socket, players, setPlayers, setPhase } = useContext(HostContext);

  useEffect(() => {
    let aborter = new AbortController();
    socket.addEventListener(
      "message",
      function lobbyHandler(e) {
        const hostEvent = JSON.parse(e.data) as HostEvent.Event;
        switch (hostEvent.type) {
          case "userJoined":
            setPlayers((players) => [
              ...players,
              { username: hostEvent.username, points: 0 },
            ]);
            break;
          case "userLeft":
            setPlayers((players) =>
              players.filter((p) => p.username !== hostEvent.username)
            );
            break;
        }
      },
      { signal: aborter.signal }
    );
    return () => aborter.abort();
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
            Começar
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
}: {
  question: rustServerQuestion;
  showAnswer: boolean;
  nextScreenHandler: () => void;
  answered: number;
  timeLeft: number;
}) {
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
          Próximo
        </GameButton>
      </div>
      <div className={`${qStyles.container}`}>
        <p className={`${qStyles.question}`}>{question.question}</p>
        <section className={`${styles.middleContainer}`}>
          <div className={`${styles.timerBubble}`}>{timeLeft}</div>
          <div className={`${styles.imageContainer}`}>
            <Image src={"/kahootBalls.gif"} layout="fill" objectFit="contain" />
          </div>
          <div className={`${styles.answerNotifier}`}>
            {`${answered} Respostas`}
          </div>
        </section>
        <div>
          <div className={`${qStyles.grid}`}>
            {question.choices.map((choice, idx) => (
              <div
                key={idx}
                className={`${qStyles.wrapper} ${[
                  qStyles.red,
                  qStyles.blue,
                  qStyles.yellow,
                  qStyles.green,
                ][idx]}`}
              >
                <span
                  className={`${qStyles.shapeContainer} ${[
                    qStyles.red,
                    qStyles.blue,
                    qStyles.yellow,
                    qStyles.green,
                  ][idx]}`}
                >
                  {idx === 0 && <BsFillTriangleFill />}
                  {idx === 1 && <BsFillSquareFill />}
                  {idx === 2 && <BsFillCircleFill />}
                  {idx === 3 && (
                    <BsFillSquareFill style={{ transform: "rotate(45deg)" }} />
                  )}
                </span>
                <div className={`${qStyles.answerContainer}`}>
                  <p className={`${qStyles.answer} ${qStyles.whiteText}`}>
                    {choice}
                  </p>
                </div>
                {showAnswer && question.answer === idx && (
                  <CheckboxCircle checked={true} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Leaderboard({ nextScreenHandler }) {
  const { players } = useContext(HostContext);
  const playerCopy = [...players].sort((a, b) => b.points - a.points);

  const imprimirClassificacao = () => {
    window.print();
  };

  return (
    <div className={`${styles.leaderboardContainer}`}>
      <p className={`${styles.leaderboardHeader}`}>
        Classificação:
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
          Próximo
        </GameButton>
      </p>

      {/* Botão de imprimir */}
      <div style={{ marginBottom: "10px" }}>
        <GameButton
          onClick={imprimirClassificacao}
          backgroundStyle={{
            backgroundColor: "#4CAF50",
            color: "white",
            fontSize: "16px",
          }}
          foregroundStyle={{
            backgroundColor: "white",
            cursor: "pointer",
            padding: "3px 13px",
          }}
        >
          Imprimir
        </GameButton>
      </div>

      {/* Área a ser impressa */}
      <div className={`printable-area ${styles.leaderboard}`}>
        {playerCopy.map((user, index) => (
          <div className={`${styles.leaderboardUser}`} key={user.username}>
            <span>
              {index + 1}. {user.username}
            </span>
            <span>{user.points} pontos</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionsPhase() {
  const { players, setPlayers, socket } = useContext(HostContext);
  const [question, setQuestion] = useState<rustServerQuestion | null>(null);
  const [answered, setAnswered] = useState<string[]>([]);
  const [timer, setTimer] = useState<{ timer: number; timeLeft: number }>({
    timer: 0,
    timeLeft: 0,
  });
  const [subscreen, setSubscreen] = useState<
    "question" | "results" | "leaderboard"
  >("question");

  useEffect(() => {
    let aborter = new AbortController();
    socket.addEventListener(
      "message",
      (e) => {
        const hostEvent = JSON.parse(e.data) as HostEvent.Event;
        switch (hostEvent.type) {
          case "roundBegin":
            setQuestion(hostEvent.question);
            setSubscreen("question");
            setAnswered([]);
            break;
          case "roundEnd":
            setPlayers((players) => {
              const copy = [...players];
              Object.entries(hostEvent.pointGains).forEach(([name, points]) => {
                const user = copy.find((u) => u.username === name);
                if (user) user.points += points;
              });
              return copy;
            });
            clearInterval(timer.timer);
            setSubscreen("results");
            break;
          case "userAnswered":
            setAnswered((a) => [...a, hostEvent.username]);
            break;
        }
      },
      { signal: aborter.signal }
    );

    socket.send(JSON.stringify({ type: "beginRound" } as action.BeginRound));
    return () => aborter.abort();
  }, []);

  useLayoutEffect(() => {
    if (question) {
      let timeLeft = question.time;
      const t = setInterval(() => {
        if (timeLeft <= 0) {
          clearInterval(t);
          socket.send(JSON.stringify({ type: "endRound" } as action.EndRound));
        } else {
          timeLeft -= 1;
          setTimer({ timeLeft, timer: t as unknown as number });
        }
      }, 1000);
      setTimer({ timeLeft, timer: t as unknown as number });
      return () => clearInterval(t);
    }
  }, [question]);

  function nextScreenHandler() {
    if (subscreen === "question") {
      clearInterval(timer.timer);
      socket.send(JSON.stringify({ type: "endRound" } as action.EndRound));
    } else if (subscreen === "results") {
      setSubscreen("leaderboard");
    } else {
      socket.send(JSON.stringify({ type: "beginRound" } as action.BeginRound));
    }
  }

  if (!question) return null;

  return (
    <div className={`vh100 ${styles.fullscreenHeight}`}>
      {subscreen === "question" && (
        <QuestionDisplay
          question={question}
          showAnswer={false}
          nextScreenHandler={nextScreenHandler}
          timeLeft={timer.timeLeft}
          answered={answered.length}
        />
      )}
      {subscreen === "results" && (
        <QuestionDisplay
          question={question}
          showAnswer={true}
          nextScreenHandler={nextScreenHandler}
          timeLeft={timer.timeLeft}
          answered={answered.length}
        />
      )}
      {subscreen === "leaderboard" && (
        <Leaderboard nextScreenHandler={nextScreenHandler} />
      )}
    </div>
  );
}

function StartScreen() {
  return (
    <div className={`${styles.startScreenContainer} vh100`}>
      <JoinHeader />
      <Lobby />
    </div>
  );
}

function Host() {
  const router = useRouter();
  const { loggedIn } = useUser();
  const [players, setPlayers] = useState<Players>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [game, setGame] = useState<db.KahootGame | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [phase, setPhase] = useState<"lobby" | "questions" | "leaderboard">(
    "lobby"
  );

  useEffect(() => {
    if (loggedIn && router.isReady) {
      const socket = new WebSocket("wss://servidor-kahoot.cloudbr.app/ws");
      const aborter = new AbortController();

      const socketPromise = new Promise<WebSocket>((resolve, reject) => {
        socket.addEventListener("open", () => resolve(socket), {
          signal: aborter.signal,
        });
        socket.addEventListener("error", reject, { signal: aborter.signal });
      });

      const gamePromise = postData<APIRequest, APIResponse>(
        "/api/getOneGame",
        { gameId: router.query.gameId as string },
        aborter.signal
      ).then((res) => (res.error ? null : res.game));

      Promise.all([socketPromise, gamePromise]).then(([ws, game]) => {
        if (!game) return;
        ws.addEventListener("message", function RoomListener(res) {
          const roomData = JSON.parse(res.data) as HostEvent.RoomCreated;
          if (roomData.type === "roomCreated") {
            setRoomId(roomData.roomId);
            setGame(game);
            setSocket(ws);
            ws.removeEventListener("message", RoomListener);
          }
        });
        ws.send(
          JSON.stringify({
            type: "createRoom",
            questions: game.questions.map((q) => ({
              ...q,
              answer: q.correctAnswer,
              correctAnswer: undefined,
            })),
          })
        );
      });

      return () => {
        aborter.abort();
        socket.close();
      };
    }
  }, [loggedIn, router.isReady]);

  if (!loggedIn || !router.isReady || !game || !socket || !roomId) {
    return (
      <div
        style={{
          backgroundColor: "rgb(70, 23, 143)",
          display: "grid",
          placeItems: "center",
          height: "100vh",
        }}
      >
        <SSRProvider>
          <Spinner animation="border" style={{ color: "white" }} />
        </SSRProvider>
      </div>
    );
  }

  return (
    <HostContext.Provider
      value={{ game, socket, roomId, players, setPlayers, setPhase }}
    >
      {phase === "lobby" && <StartScreen />}
      {phase === "questions" && <QuestionsPhase />}
    </HostContext.Provider>
  );
}

export default Host;

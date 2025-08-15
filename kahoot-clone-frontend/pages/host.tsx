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
  const { game, roomId, socket, players, setPlayers, setPhase } =
    useContext(HostContext);

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
              if (players.length !== 0) setPhase("questions");
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
              padding: "3px 13px",
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
            padding: "3px 13px",
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
            <Image
              src={"/kahootBalls.gif"}
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div className={`${styles.answerNotifier}`}>{`${answered} Respostas`}</div>
        </section>
        <div className={`${qStyles.grid}`}>
          {question.choices.map((choice, idx) => {
            const colorClass = [qStyles.red, qStyles.blue, qStyles.yellow, qStyles.green][idx];
            const ShapeIcon = [BsFillTriangleFill, BsFillSquareFill, BsFillCircleFill, BsFillSquareFill][idx];
            const rotateStyle = idx === 3 ? { transform: "rotate(45deg)" } : {};
            return (
              <div key={idx} className={`${qStyles.wrapper} ${colorClass}`}>
                <span className={`${qStyles.shapeContainer} ${colorClass}`}>
                  <ShapeIcon style={rotateStyle} />
                </span>
                <div className={`${qStyles.answerContainer}`}>
                  <p className={`${qStyles.answer} ${qStyles.whiteText}`}>{choice}</p>
                </div>
                {showAnswer && question.answer === idx && <CheckboxCircle checked />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Leaderboard({ nextScreenHandler }) {
  const { players } = useContext(HostContext);
  const playerCopy = [...players].sort((a, b) => b.points - a.points);

  function printLeaderboard() {
    const printContent = document.getElementById("leaderboardTable")?.outerHTML;
    if (printContent) {
      const newWin = window.open("");
      newWin.document.write(`<html><body>${printContent}</body></html>`);
      newWin.document.close();
      newWin.print();
    }
  }

  return (
    <div className={`${styles.leaderboardContainer}`}>
      <p className={`${styles.leaderboardHeader}`}>
        Classificação:
        <div>
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
              padding: "3px 13px",
            }}
          >
            Próximo
          </GameButton>
          <GameButton
            onClick={printLeaderboard}
            backgroundStyle={{
              backgroundColor: "lightgray",
              color: "black",
              fontSize: "19px",
              marginLeft: "10px",
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
      </p>
      <div id="leaderboardTable" className={`${styles.leaderboard}`}>
        {playerCopy.map((user, index) => (
          <div key={user.username} className={`${styles.leaderboardUser}`}>
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
  const { game, players, roomId, setPhase, setPlayers, socket } =
    useContext(HostContext);
  const [question, setQuestion] = useState<null | rustServerQuestion>(null);
  const [answered, setAnswered] = useState<string[]>([]);
  const [timer, setTimer] = useState<{ timer: number; timeLeft: number }>({
    timer: 0,
    timeLeft: 0,
  });
  const [subscreen, setSubscreen] = useState<"question" | "results" | "leaderboard">(
    "question"
  );

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
              Object.entries(hostEvent.pointGains).forEach(([username, points]) => {
                const user = copy.find((u) => u.username === username);
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
          case "userJoined":
            setPlayers((players) => [...players, { username: hostEvent.username, points: 0 }]);
            break;
          case "userLeft":
            setPlayers((players) => players.filter((p) => p.username !== hostEvent.username));
            break;
        }
      },
      { signal: aborter.signal }
    );

    const startGameRequest: action.BeginRound = { type: "beginRound" };
    socket.send(JSON.stringify(startGameRequest));

    return () => aborter.abort();
  }, []);

  useLayoutEffect(() => {
    if (question !== null) {
      let timeLeft = question.time;
      const timerInterval = setInterval(() => {
        if (timeLeft === 0) {
          clearInterval(timerInterval);
          socket.send(JSON.stringify({ type: "endRound" } as action.EndRound));
          return;
        }
        timeLeft -= 1;
        setTimer({ timeLeft, timer: timerInterval as unknown as number });
      }, 1000);
      setTimer({ timer: timerInterval as unknown as number, timeLeft });
      return () => clearInterval(timerInterval);
    }
  }, [question]);

  function nextScreenHandler() {
    switch (subscreen) {
      case "question":
        clearInterval(timer.timer);
        socket.send(JSON.stringify({ type: "endRound" } as action.EndRound));
        break;
      case "results":
        setSubscreen("leaderboard");
        break;
      case "leaderboard":
        socket.send(JSON.stringify({ type: "beginRound" } as action.BeginRound));
        break;
    }
  }

  if (question === null) return <></>;

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
  const { loggedIn, user } = useUser();
  const [players, setPlayers] = useState<Players>([]);
  const [socket, setSocket] = useState<null | WebSocket>(null);
  const [game, setGame] = useState<null | db.KahootGame>(null);
  const [roomId, setRoomId] = useState<null | number>(null);
  const [connectionClosed, setConnectionClosed] = useState(false);
  const [phase, setPhase] = useState<"lobby" | "questions" | "leaderboard">(
    "lobby"
  );

  const gameId = router.query.gameId as string;

  useEffect(() => {
    if (loggedIn && router.isReady) {
      const ws = new WebSocket("wss://servidor-kahoot.cloudbr.app/ws");
      const aborter = new AbortController();

      const socketPromise = new Promise<WebSocket>((resolve, reject) => {
        ws.addEventListener("open", () => resolve(ws), { signal: aborter.signal });
        ws.addEventListener("error", (e) => reject(e), { signal: aborter.signal });
      });

      const gamePromise = postData<APIRequest, APIResponse>(
        "/api/getOneGame",
        { gameId },
        aborter.signal
      ).then((res) => {
        if ("error" in res && res.error) return null;
        if ("game" in res) return res.game;
        return null;
      });

      Promise.all([socketPromise, gamePromise])
        .then(([ws, gameData]) => {
          if (!gameData) return;
          setGame(gameData);

          ws.addEventListener("message", function RoomListener(res) {
            const roomData = JSON.parse(res.data) as HostEvent.RoomCreated;
            if (roomData.type === "roomCreated") {
              setRoomId(roomData.roomId);
              setSocket(ws);
              ws.onclose = () => {
                console.log("socket closed");
                setConnectionClosed(true);
                location.reload();
              };
              ws.removeEventListener("message", RoomListener);
            }
          });

          ws.send(
            JSON.stringify({
              type: "createRoom",
              questions: gameData.questions.map((q) => ({
                ...q,
                answer: q.correctAnswer,
              })),
            })
          );
        })
        .catch(() => {
          console.log("O websocket ou a solicitação de fetch falharam");
          aborter.abort();
        });

      return () => {
        aborter.abort();
        ws.close();
      };
    }
  }, [loggedIn, router.isReady]);

  if (!loggedIn || !router.isReady || !game || !socket || !roomId) {
    return (
      <div className="vh100">
        <Spinner animation="border" role="status">
          <span className="sr-only">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <HostContext.Provider
      value={{ game, socket, roomId, players, setPlayers, setPhase }}
    >
      {phase === "lobby" && <StartScreen />}
      {phase === "questions" && <QuestionsPhase />}
      {phase === "leaderboard" && <Leaderboard nextScreenHandler={() => {}} />}
    </HostContext.Provider>
  );
}

export default Host;

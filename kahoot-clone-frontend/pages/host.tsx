import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import styles from "@styles/host.module.css";
import { IoMdPerson } from "react-icons/io";
import GameButton from "@components/GameButton";
import type { action, db, HostEvent, rustServerQuestion } from "kahoot";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "./api/getOneGame";
import qStyles from "@styles/Editor.module.css";
import {
  BsFillCircleFill,
  BsFillSquareFill,
  BsFillTriangleFill,
} from "react-icons/bs";
import { FaCheck } from "react-icons/fa";

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
  console.log(roomId);
  return (
    <div className={`${styles.darkBackground}`}>
      <div className={`${styles.outerContainer}`}>
        <div className={`${styles.playHeader}`}>
          <p>Join at kahoot-clone.vercel.app</p>
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
  const { game, roomId, socket, players, setPlayers, setPhase } =
    useContext(HostContext);
  useEffect(() => {
    console.log("Lobby running");
    let aborter = new AbortController();
    socket.addEventListener(
      "message",
      function lobbyHandler(e) {
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
            console.log("Someone left");
            setPlayers((players) => {
              const copy = [...players];
              const indexToDelete = copy.findIndex((player) => {
                return player.username === hostEvent.username;
              });
              copy.splice(indexToDelete, 1);
              return copy;
            });
            break;
        }
      },
      { signal: aborter.signal }
    );
    return () => {
      aborter.abort();
    };
  }, []);
  return (
    <div className={`${styles.lobby}`}>
      <div className={`${styles.lobbyHeaderContainer}`}>
        <div className={`${styles.lobbyPeople}`}>
          <IoMdPerson></IoMdPerson>
          <span>{players.length}</span>
        </div>
        <div>
          <span>Kahoot!</span>
        </div>
        <div>
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
        {players.map((player) => {
          return (
            <span key={player.username} className={`${styles.lobbyUser}`}>
              {player.username}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  question: rustServerQuestion;
  showAnswer: boolean;
}

function CheckboxCircle({ checked }: { checked: boolean }) {
  return (
    <div className={`${qStyles.checkBoxOuter} ${checked ? qStyles.green : ""}`}>
      <div className={`${qStyles.checkBoxInner}`}>
        <FaCheck className={`${!checked ? qStyles.hidden : ""}`}></FaCheck>
      </div>
    </div>
  );
}

function QuestionDisplay({ question, showAnswer }: Props) {
  return (
    <div className={`${qStyles.container}`}>
      <p
        contentEditable="true"
        className={`${qStyles.question}`}
        placeholder="Question..."
        suppressContentEditableWarning
      >
        {question.question}
      </p>
      <div>
        <div className={`${qStyles.grid}`}>
          <div className={`${qStyles.wrapper} ${qStyles.red}`}>
            <span className={`${qStyles.shapeContainer} ${qStyles.red}`}>
              <BsFillTriangleFill></BsFillTriangleFill>
            </span>
            <div className={`${qStyles.answerContainer}`}>
              <p
                contentEditable="true"
                placeholder="Answer 1"
                className={`${qStyles.answer} `}
                suppressContentEditableWarning
              >
                {question.choices[0]}
              </p>
            </div>
            {showAnswer && question.answer === 0 && (
              <CheckboxCircle checked={true}></CheckboxCircle>
            )}
          </div>
          <div
            className={`${qStyles.wrapper} 
          ${qStyles.blue}`}
          >
            <span className={`${qStyles.shapeContainer} ${qStyles.blue}`}>
              <BsFillSquareFill></BsFillSquareFill>
            </span>
            <div className={`${qStyles.answerContainer}`}>
              <p
                contentEditable="true"
                className={`${qStyles.answer} ${qStyles.whiteText}
            `}
                placeholder="Answer 2"
                suppressContentEditableWarning
              >
                {question.choices[1]}
              </p>
            </div>
            {showAnswer && question.answer === 1 && (
              <CheckboxCircle checked={true}></CheckboxCircle>
            )}
          </div>
          <div className={`${qStyles.wrapper} ${qStyles.yellow}`}>
            <span className={`${qStyles.shapeContainer} ${qStyles.yellow}`}>
              <BsFillCircleFill></BsFillCircleFill>
            </span>
            <div className={`${qStyles.answerContainer}`}>
              <p
                contentEditable="true"
                className={`${qStyles.answer} 
              ${qStyles.whiteText}`}
                suppressContentEditableWarning
              >
                {question.choices[2]}
              </p>
            </div>
            {showAnswer && question.answer === 2 && (
              <CheckboxCircle checked={true}></CheckboxCircle>
            )}
          </div>
          <div className={`${qStyles.wrapper} ${qStyles.green}`}>
            <span className={`${qStyles.shapeContainer} ${qStyles.green}`}>
              <BsFillSquareFill
                style={{ transform: "rotate(45deg)" }}
              ></BsFillSquareFill>
            </span>
            <div className={`${qStyles.answerContainer}`}>
              <p
                contentEditable="true"
                className={`${qStyles.answer} ${qStyles.whiteText}`}
                suppressContentEditableWarning
              >
                {question.choices[3]}
              </p>
            </div>
            {showAnswer && question.answer === 3 && (
              <CheckboxCircle checked={true}></CheckboxCircle>
            )}
          </div>
        </div>
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

  const [results, setResults] = useState<null | { correctAnswers: number }>(
    null
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
            break;
          case "roundEnd":
            setPlayers((players) => {
              const copy = [...players];
              //todo: n^2 to n
              Object.entries(hostEvent.pointGains).forEach((pair) => {
                const user = copy.find((user) => user.username === pair[0]);
                if (user) user.points += pair[1];
              });

              return copy;
            });
            setResults(() => {
              let correct = 0;
              Object.values(hostEvent.pointGains).forEach((val) => {
                if (val !== 0) correct += 1;
              });
              return { correctAnswers: correct };
            });
            break;
          case "userAnswered":
            setAnswered((a) => {
              let copy = [...a];
              copy.push(hostEvent.username);
              return copy;
            });
          case "gameEnd":
            setPhase("leaderboard");
        }
      },
      { signal: aborter.signal }
    );

    const startGameRequest: action.BeginRound = { type: "beginRound" };
    socket.send(JSON.stringify(startGameRequest));
  }, []);

  useLayoutEffect(() => {
    if (question !== null) {
      let timeLeft = question.time;

      const timer = setInterval(() => {
        if (timeLeft === 0) {
          clearInterval(timer);
          const endRoundRequest: action.EndRound = { type: "endRound" };
          socket.send(JSON.stringify(endRoundRequest));
          return;
        }
        timeLeft -= 1;
        setTimer({ timeLeft, timer });
      }, 1000) as unknown as number;
      setTimer({ timer, timeLeft });
      return () => {
        clearInterval(timer);
      };
    }
  }, [question]);

  if (question === null) {
    return <></>;
  }
  console.log(question);
  return (
    <div className="vh100">
      <QuestionDisplay
        question={question}
        showAnswer={!!results}
      ></QuestionDisplay>
      <button
        onClick={() => {
          clearInterval(timer.timer);
          const endRoundRequest: action.EndRound = { type: "endRound" };
          socket.send(JSON.stringify(endRoundRequest));
        }}
      >
        Skip
      </button>
      <div>{timer.timeLeft} seconds left</div>
    </div>
  );
}

function StartScreen() {
  return (
    <div className={`${styles.startScreenContainer} vh100`}>
      <JoinHeader></JoinHeader>
      <Lobby></Lobby>
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
      const socket = new WebSocket("wss://64.225.12.53/ws");
      const aborter = new AbortController();
      const socketPromise = new Promise((resolve, reject) => {
        socket.addEventListener(
          "open",
          () => {
            resolve(socket);
          },
          { signal: aborter.signal }
        );
        socket.addEventListener(
          "error",
          (e) => {
            reject(e);
          },
          { signal: aborter.signal }
        );
      });
      const gamePromise = postData<APIRequest, APIResponse>(
        "/api/getOneGame",
        {
          gameId: gameId,
        },
        aborter.signal
      ).then((res) => {
        if (res.error === false) {
          return res.game;
        } else {
          //todo: error handling for could not find game
        }
      });
      Promise.all([socketPromise, gamePromise])
        .then((results) => {
          console.log(results);
          console.log(socket);
          socket.addEventListener("message", function RoomListener(res) {
            const roomData = JSON.parse(res.data) as HostEvent.RoomCreated;
            if (roomData.type === "roomCreated") {
              setRoomId(roomData.roomId);
              setGame(results[1]);
              setSocket(socket);
              socket.removeEventListener("message", RoomListener);
              socket.onclose = () => {
                setConnectionClosed(true);
              };
            }
          });
          socket.send(
            JSON.stringify({
              type: "createRoom",
              questions: results[1].questions.map((question) => {
                const formattedQuestion = { ...question } as any;
                formattedQuestion.answer = formattedQuestion.correctAnswer;
                delete formattedQuestion.correctAnswer;
                return formattedQuestion;
              }),
            })
          );
        })

        .catch(() => {
          console.log("Either the websocket or the fetch request failed");
          aborter.abort(); //Cancel websocket or fetch request if either fails.
        });
      return () => {
        if (loggedIn && router.isReady) {
          aborter.abort();
          socket.close();
        }
      };
    }
  }, [loggedIn, router.isReady]);

  useEffect(() => {
    if (connectionClosed) {
      console.log("Connection was closed");
    }
  }, [connectionClosed]);

  if (!loggedIn || !router.isReady || !game || !socket || !roomId) {
    //Loading screen
    return (
      <div
        className="vh100"
        style={{ backgroundColor: "background-color: rgb(70, 23, 143)" }}
      ></div>
    );
  }
  return (
    <div>
      <HostContext.Provider
        value={{ game, socket, roomId, players, setPlayers, setPhase }}
      >
        {phase === "lobby" && <StartScreen></StartScreen>}
        {phase === "questions" && <QuestionsPhase></QuestionsPhase>}
      </HostContext.Provider>
    </div>
  );
}

export default Host;

import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import styles from "@styles/host.module.css";
import { IoMdPerson } from "react-icons/io";
import GameButton from "@components/GameButton";
import type { action, db, HostEvent } from "kahoot";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "./api/getOneGame";

const HostContext = React.createContext<Context>(null);

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

function QuestionsPhase() {
  return <div></div>;
}

function StartScreen() {
  return (
    <div className={`${styles.startScreenContainer} vh100`}>
      <JoinHeader></JoinHeader>
      <Lobby></Lobby>
    </div>
  );
}

type Players = { username: string; points: number }[];

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
      console.log("this should only run once");
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

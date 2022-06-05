import { action, UserEvent } from "kahoot";
import React, { useEffect, useState, useContext } from "react";
import { Spinner } from "react-bootstrap";
import styles from "../styles/Play.module.css";

const PlayerContext = React.createContext<Context>(null);

interface Context {
  socket: WebSocket;
  points: number;
  setSocket: React.Dispatch<React.SetStateAction<null | WebSocket>>;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
}

function StartScreen() {
  const [pin, setPin] = useState("");
  const [connectionClosed, setConnectionClosed] = useState(false);
  const { setUsername, username, setSocket } = useContext(PlayerContext);
  const [inputLocked, setInputLocked] = useState(false);
  useEffect(() => {
    if (inputLocked) {
      const socket = new WebSocket("ws://64.225.12.53/ws");
      const aborter = new AbortController();
      socket.addEventListener(
        "message",
        function handler(e) {
          const userEvent = JSON.parse(e.data) as UserEvent.event;
          switch (userEvent.type) {
            case "joined":
              setSocket(socket);
              socket.removeEventListener("message", handler);
              console.log("Joined");

              break;
            case "joinFailed":
              setInputLocked(false);
              console.log(userEvent.reason);
              //todo: join fail handling
              break;
          }
        },
        { signal: aborter.signal }
      );
      socket.addEventListener(
        "open",
        function handler(e) {
          const request: action.JoinRoom = {
            type: "joinRoom",
            roomId: parseInt(pin),
            username: username,
          };
          socket.send(JSON.stringify(request));
          console.log(socket);
          console.log(request);
        },
        { signal: aborter.signal }
      );
      socket.onclose = () => {
        setConnectionClosed(true);
      };
      return () => {
        if (inputLocked) {
          aborter.abort();
        }
      };
    }
  }, [inputLocked]);
  useEffect(() => {
    if (connectionClosed) {
      console.log("Connection was closed");
    }
  }, [connectionClosed]);
  return (
    <div className={`${styles.backdrop}`}>
      <div className={`${styles.gameBox}`}>
        <p className={`${styles.logo}`}>Kahoot!</p>
        <div className={`${styles.gameInput}`}>
          <input
            type="text"
            placeholder="Game PIN"
            className={`${styles.gameInputPin}`}
            onChange={(e) => {
              setPin(e.target.value);
            }}
            value={pin}
            readOnly={inputLocked}
          ></input>
          <input
            type="text"
            placeholder="Username"
            className={`${styles.gameInputPin}`}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            value={username}
            readOnly={inputLocked}
          ></input>
          <button
            className={`${styles.gameButton}`}
            onClick={() => {
              setInputLocked(true);
            }}
          >
            {inputLocked && (
              <span>
                <Spinner
                  animation="border"
                  style={{ height: "24px", width: "24px" }}
                ></Spinner>
              </span>
            )}
            {!inputLocked && <span>Enter</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Play() {
  const [socket, setSocket] = useState<null | WebSocket>(null);
  const [points, setPoints] = useState(0);
  const [username, setUsername] = useState("");
  return (
    <>
      <PlayerContext.Provider
        value={{ socket, points, setSocket, setPoints, username, setUsername }}
      >
        <StartScreen></StartScreen>
      </PlayerContext.Provider>
    </>
  );
}

export default Play;

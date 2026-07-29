import { action, UserEvent } from "kahoot";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "../styles/Play.module.css";
import { getWebSocketUrl } from "@lib/websocket";
import NoticeModal from "@components/NoticeModal";
import {
  BsFillCircleFill,
  BsFillSquareFill,
  BsFillTriangleFill,
} from "react-icons/bs";
import { FaCheck } from "react-icons/fa";
import { FiArrowLeft, FiClock, FiRefreshCw, FiWifi } from "react-icons/fi";

const PlayerContext = React.createContext<Context>(null);

type PlayerSubpage =
  | "StartScreen"
  | "LobbyWaiting"
  | "ChooseAnswer"
  | "Result"
  | "Finished";

interface Context {
  socket: WebSocket;
  points: number;
  setSocket: React.Dispatch<React.SetStateAction<WebSocket | null>>;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setSubpage: React.Dispatch<React.SetStateAction<PlayerSubpage>>;
}

function PlayerFrame({
  children,
  stage,
}: {
  children: React.ReactNode;
  stage?: string;
}) {
  return (
    <main className={styles.backdrop}>
      <div className={styles.ambientOrb} aria-hidden="true" />
      <header className={styles.topbar}>
        <strong>Kahoot!</strong>
        {stage && <span>{stage}</span>}
      </header>
      <div className={styles.gameBox}>{children}</div>
    </main>
  );
}

function LobbyWaiting() {
  const { username } = useContext(PlayerContext);

  return (
    <PlayerFrame stage="Sala de espera">
      <section className={styles.statusCard}>
        <span className={styles.statusIcon}>
          <FiWifi aria-hidden="true" />
        </span>
        <p className={styles.eyebrow}>Você está dentro!</p>
        <h1>Vê seu nome na tela?</h1>
        <div className={styles.playerName}>{username}</div>
        <p className={styles.muted}>
          Esperando o apresentador começar a partida...
        </p>
      </section>
    </PlayerFrame>
  );
}

function StartScreen() {
  const [pin, setPin] = useState("");
  const [connectionClosed, setConnectionClosed] = useState(false);
  const [error, setError] = useState("");
  const { setUsername, username, setSocket, setSubpage } =
    useContext(PlayerContext);
  const [inputLocked, setInputLocked] = useState(false);

  useEffect(() => {
    if (!inputLocked) return;

    setError("");
    const socket = new WebSocket(getWebSocketUrl());
    const aborter = new AbortController();
    socket.addEventListener(
      "message",
      function handler(event) {
        const userEvent = JSON.parse(event.data) as UserEvent.event;
        switch (userEvent.type) {
          case "joined":
            setSocket(socket);
            socket.removeEventListener("message", handler);
            setSubpage("LobbyWaiting");
            break;
          case "joinFailed":
            setInputLocked(false);
            setError(
              userEvent.reason === "Duplicate user"
                ? "Esse nome já está sendo usado na sala."
                : "Sala não encontrada ou partida já iniciada."
            );
            socket.close();
            break;
        }
      },
      { signal: aborter.signal }
    );
    socket.addEventListener(
      "open",
      () => {
        const request: action.JoinRoom = {
          type: "joinRoom",
          roomId: parseInt(pin.replace(/\s/g, ""), 10),
          username,
        };
        socket.send(JSON.stringify(request));
      },
      { signal: aborter.signal }
    );
    socket.onclose = () => setConnectionClosed(true);
    socket.onerror = () => {
      setError("Não foi possível conectar ao servidor da partida.");
      setInputLocked(false);
    };

    return () => aborter.abort();
  }, [inputLocked, pin, setSocket, setSubpage, username]);

  useEffect(() => {
    if (connectionClosed && inputLocked) {
      setError("A conexão com a sala foi encerrada.");
      setInputLocked(false);
    }
  }, [connectionClosed, inputLocked]);

  function joinRoom() {
    const normalizedPin = pin.replace(/\s/g, "");
    const normalizedUsername = username.trim();
    if (!/^\d{6}$/.test(normalizedPin)) {
      setError("Informe um PIN de 6 números.");
      return;
    }
    if (normalizedUsername.length < 2 || normalizedUsername.length > 24) {
      setError("Seu nome deve ter entre 2 e 24 caracteres.");
      return;
    }
    setUsername(normalizedUsername);
    setInputLocked(true);
  }

  return (
    <PlayerFrame>
      <section className={styles.joinPanel}>
        <p className={styles.eyebrow}>Jogar ao vivo</p>
        <h1>Entre na sala</h1>
        <p className={styles.intro}>
          Digite o PIN mostrado pelo apresentador e escolha como quer aparecer.
        </p>
        <div className={styles.gameInput}>
          <label>
            <span>Game PIN</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Game PIN"
              className={styles.gameInputPin}
              onChange={(event) => setPin(event.target.value)}
              value={pin}
              readOnly={inputLocked}
              maxLength={7}
            />
          </label>
          <label>
            <span>Seu nome</span>
            <input
              type="text"
              autoComplete="nickname"
              placeholder="Seu nome"
              className={styles.gameInputPin}
              onChange={(event) => setUsername(event.target.value)}
              value={username}
              readOnly={inputLocked}
              maxLength={24}
            />
          </label>
          <button
            type="button"
            className={styles.gameButton}
            onClick={joinRoom}
            disabled={inputLocked}
          >
            {inputLocked ? (
              <>
                <span className={styles.inlineSpinner} aria-hidden="true" />
                Entrando...
              </>
            ) : (
              "Entrar na sala"
            )}
          </button>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => window.location.assign("/")}
          >
            <FiArrowLeft aria-hidden="true" />
            Voltar ao início
          </button>
        </div>
      </section>
      <NoticeModal
        open={error !== ""}
        title="Não foi possível entrar na sala"
        messages={error ? [error] : []}
        tone="error"
        onClose={() => setError("")}
      />
    </PlayerFrame>
  );
}

function AnswerShape({ index }: { index: number }) {
  if (index === 0) return <BsFillTriangleFill aria-hidden="true" />;
  if (index === 1)
    return <BsFillSquareFill className={styles.diamond} aria-hidden="true" />;
  if (index === 2) return <BsFillCircleFill aria-hidden="true" />;
  return <BsFillSquareFill aria-hidden="true" />;
}

function ChooseAnswer({ data }: { data: UserEvent.event }) {
  const { socket } = useContext(PlayerContext);
  const choices = (data as UserEvent.RoundBegin).choices;
  const [madeChoice, setMadeChoice] = useState(false);
  const colors = [styles.red, styles.blue, styles.yellow, styles.green];

  function onChoiceMade(index: number) {
    setMadeChoice(true);
    const request: action.Answer = { type: "answer", choice: index };
    socket.send(JSON.stringify(request));
  }

  if (madeChoice) {
    return (
      <PlayerFrame stage="Resposta enviada">
        <section className={styles.statusCard}>
          <span className={`${styles.statusIcon} ${styles.successIcon}`}>
            <FaCheck aria-hidden="true" />
          </span>
          <p className={styles.eyebrow}>Tudo certo</p>
          <h1>Resposta registrada</h1>
          <p className={styles.muted}>
            Agora é só esperar a rodada terminar.
          </p>
        </section>
      </PlayerFrame>
    );
  }

  return (
    <PlayerFrame stage="Escolha uma resposta">
      <section className={styles.answerPanel}>
        <div className={styles.answerHeading}>
          <FiClock aria-hidden="true" />
          <h1>Toque na sua resposta</h1>
        </div>
        <div className={styles.answerGrid}>
          {choices.map((choice, index) => {
            if (!choice) return null;
            return (
              <button
                type="button"
                className={`${styles.answerButton} ${colors[index]}`}
                aria-label={`Resposta ${index + 1}`}
                key={`${choice}-${index}`}
                onClick={() => onChoiceMade(index)}
              >
                <AnswerShape index={index} />
                <span>{index + 1}</span>
              </button>
            );
          })}
        </div>
      </section>
    </PlayerFrame>
  );
}

function Result({ data }: { data: UserEvent.event }) {
  const pointGain = (data as UserEvent.RoundEnd).pointGain;
  const { points } = useContext(PlayerContext);
  const isCorrect = pointGain !== null;

  return (
    <PlayerFrame stage="Resultado da rodada">
      <section className={styles.statusCard}>
        <span
          className={`${styles.statusIcon} ${
            isCorrect ? styles.successIcon : styles.errorIcon
          }`}
        >
          {isCorrect ? <FaCheck aria-hidden="true" /> : "×"}
        </span>
        <p className={styles.eyebrow}>
          {isCorrect ? "Boa resposta" : "Quase lá"}
        </p>
        <h1>{isCorrect ? "Você acertou!" : "Você errou :("}</h1>
        {isCorrect ? (
          <p className={styles.pointGain}>+{pointGain} pontos</p>
        ) : (
          <p className={styles.muted}>Você não recebeu nenhum ponto.</p>
        )}
        <div className={styles.totalPoints}>Total: {points} pontos</div>
      </section>
    </PlayerFrame>
  );
}

function FinalRanking({
  data,
  onJoinAnotherRoom,
}: {
  data: UserEvent.GameEnd;
  onJoinAnotherRoom: () => void;
}) {
  const { username } = useContext(PlayerContext);
  const playerPosition =
    data.ranking.findIndex((player) => player.username === username) + 1;

  return (
    <PlayerFrame stage="Partida concluída">
      <section className={`${styles.statusCard} ${styles.finalCard}`}>
        <p className={styles.eyebrow}>Resultado final</p>
        <h1>Classificação</h1>
        {playerPosition > 0 && (
          <p className={styles.finalPosition}>
            Sua posição: <strong>{playerPosition}º lugar</strong>
          </p>
        )}
        <div className={styles.finalRanking}>
          {data.ranking.map((player, index) => (
            <div
              className={`${styles.rankingRow} ${
                player.username === username ? styles.currentPlayer : ""
              }`}
              key={player.username}
            >
              <span className={styles.rankingPosition}>{index + 1}</span>
              <strong>{player.username}</strong>
              <span>{player.points} pontos</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.newRoomButton}
          onClick={onJoinAnotherRoom}
        >
          <FiRefreshCw aria-hidden="true" />
          Entrar em uma nova sala
        </button>
      </section>
    </PlayerFrame>
  );
}

function Play() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [points, setPoints] = useState(0);
  const [username, setUsername] = useState("");
  const [subpage, setSubpage] = useState<PlayerSubpage>("StartScreen");
  const router = useRouter();
  const [subpageData, setSubpageData] = useState<UserEvent.event | null>(null);
  const gameFinishedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;
    const aborter = new AbortController();
    socket.addEventListener(
      "message",
      (event) => {
        const hostEvent = JSON.parse(event.data) as UserEvent.event;
        switch (hostEvent.type) {
          case "gameEnd":
            gameFinishedRef.current = true;
            setSubpage("Finished");
            setSubpageData(hostEvent);
            break;
          case "roundBegin":
            setSubpage("ChooseAnswer");
            setSubpageData(hostEvent);
            break;
          case "roundEnd":
            setPoints((current) => current + (hostEvent.pointGain || 0));
            setSubpage("Result");
            setSubpageData(hostEvent);
            break;
        }
      },
      { signal: aborter.signal }
    );
    socket.addEventListener(
      "close",
      () => {
        if (!gameFinishedRef.current) void router.push("/");
      },
      { signal: aborter.signal }
    );
    return () => aborter.abort();
  }, [router, socket]);

  function joinAnotherRoom() {
    gameFinishedRef.current = false;
    setSocket(null);
    setPoints(0);
    setSubpageData(null);
    setSubpage("StartScreen");
  }

  return (
    <PlayerContext.Provider
      value={{
        socket,
        points,
        setSocket,
        setPoints,
        username,
        setUsername,
        setSubpage,
      }}
    >
      {subpage === "StartScreen" && <StartScreen />}
      {subpage === "LobbyWaiting" && <LobbyWaiting />}
      {subpage === "ChooseAnswer" && subpageData && (
        <ChooseAnswer data={subpageData} />
      )}
      {subpage === "Result" && subpageData && <Result data={subpageData} />}
      {subpage === "Finished" && subpageData?.type === "gameEnd" && (
        <FinalRanking
          data={subpageData}
          onJoinAnotherRoom={joinAnotherRoom}
        />
      )}
    </PlayerContext.Provider>
  );
}

export default Play;

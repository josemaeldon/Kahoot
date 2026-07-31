import { action, UserEvent } from "play";
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
import {
  FiArrowLeft,
  FiClock,
  FiLogOut,
  FiRefreshCw,
  FiWifi,
} from "react-icons/fi";

const PlayerContext = React.createContext<Context>(null);

type PlayerSubpage =
  | "StartScreen"
  | "LobbyWaiting"
  | "ChooseAnswer"
  | "Result"
  | "Finished";

interface Context {
  points: number;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setSubpage: React.Dispatch<React.SetStateAction<PlayerSubpage>>;
  connectionStatus: ConnectionStatus;
  joinRoom: (roomId: number, username: string) => Promise<void>;
  sendAction: (request: action.Answer) => boolean;
  requestLeave: () => void;
}

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting";

interface PlayerSession {
  roomId: number;
  username: string;
  sessionToken: string;
}

const PLAYER_SESSION_KEY = "play-player-session-v1";
const SOCKET_OPEN_TIMEOUT_MS = 10_000;
const SOCKET_STALE_AFTER_MS = 55_000;

function PlayerFrame({
  children,
  stage,
}: {
  children: React.ReactNode;
  stage?: string;
}) {
  const { connectionStatus, requestLeave } = useContext(PlayerContext);
  const canLeave = Boolean(stage && stage !== "Partida concluída");

  return (
    <main className={styles.backdrop}>
      <div className={styles.ambientOrb} aria-hidden="true" />
      <header className={styles.topbar}>
        <strong>Play!</strong>
        <div className={styles.stageStatus}>
          {connectionStatus === "reconnecting" && (
            <span className={styles.reconnectingBadge}>
              <span className={styles.inlineSpinner} aria-hidden="true" />
              Reconectando
            </span>
          )}
          {stage && <span className={styles.stageLabel}>{stage}</span>}
          {canLeave && (
            <button
              type="button"
              className={styles.leaveButton}
              onClick={requestLeave}
            >
              <FiLogOut aria-hidden="true" />
              Sair
            </button>
          )}
        </div>
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
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const { setUsername, username, joinRoom: connectToRoom } =
    useContext(PlayerContext);
  const [inputLocked, setInputLocked] = useState(false);
  const pinFromUrl =
    router.isReady &&
    typeof router.query.pin === "string" &&
    /^\d{6}$/.test(router.query.pin)
      ? router.query.pin
      : "";

  useEffect(() => {
    if (pinFromUrl) setPin(pinFromUrl);
  }, [pinFromUrl]);

  async function joinRoom() {
    const normalizedPin = (pinFromUrl || pin).replace(/\s/g, "");
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
    setError("");
    try {
      await connectToRoom(Number(normalizedPin), normalizedUsername);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : "";
      setError(
        reason === "Duplicate user"
          ? "Esse nome já está sendo usado na sala."
          : reason === "Room does not exist"
            ? "Sala não encontrada."
            : "Não foi possível conectar ao servidor da partida."
      );
      setInputLocked(false);
    }
  }

  return (
    <PlayerFrame>
      <section className={styles.joinPanel}>
        <p className={styles.eyebrow}>Jogar ao vivo</p>
        <h1>Entre na sala</h1>
        <p className={styles.intro}>
          {pinFromUrl
            ? "O PIN desta sala já está preenchido. Digite apenas como quer aparecer."
            : "Digite o PIN mostrado pelo apresentador e escolha como quer aparecer."}
        </p>
        <div className={styles.gameInput}>
          {pinFromUrl ? (
            <div className={styles.automaticPin} aria-label="Game PIN preenchido">
              <div>
                <span>Game PIN</span>
                <strong>
                  {pinFromUrl.slice(0, 3)} {pinFromUrl.slice(3)}
                </strong>
              </div>
              <small>Preenchido pelo QR Code</small>
            </div>
          ) : (
            <label>
              <span>Game PIN</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                placeholder="Game PIN"
                className={styles.gameInputPin}
                onChange={(event) => setPin(event.target.value)}
                value={pin}
                readOnly={inputLocked}
                maxLength={7}
              />
            </label>
          )}
          <label>
            <span>Seu nome</span>
            <input
              type="text"
              autoComplete="nickname"
              autoFocus={Boolean(pinFromUrl)}
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
  const { sendAction } = useContext(PlayerContext);
  const choices = (data as UserEvent.RoundBegin).choices;
  const [madeChoice, setMadeChoice] = useState(false);
  const colors = [styles.red, styles.blue, styles.yellow, styles.green];

  function onChoiceMade(index: number) {
    const request: action.Answer = { type: "answer", choice: index };
    if (sendAction(request)) setMadeChoice(true);
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
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [username, setUsername] = useState("");
  const [subpage, setSubpage] = useState<PlayerSubpage>("StartScreen");
  const [subpageData, setSubpageData] = useState<UserEvent.event | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState("");
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const gameFinishedRef = useRef(false);
  const mountedRef = useRef(false);
  const stoppedRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingSocketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<PlayerSession | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastServerMessageAtRef = useRef(0);
  const handleEventRef = useRef<(event: UserEvent.event) => void>(() => {});
  const reconnectRef = useRef<() => void>(() => {});
  const openSocketRef = useRef<
    (
      request: action.JoinRoom | action.ResumeRoom,
      mode: "join" | "resume"
    ) => Promise<void>
  >(async () => {});

  handleEventRef.current = (serverEvent) => {
    switch (serverEvent.type) {
      case "keepAlive":
      case "joined":
      case "joinFailed":
        break;
      case "gameEnd":
        gameFinishedRef.current = false;
        setSubpage("Finished");
        setSubpageData(serverEvent);
        break;
      case "nextGame":
        gameFinishedRef.current = false;
        setPoints(0);
        setSubpage("LobbyWaiting");
        setSubpageData(serverEvent);
        break;
      case "roundBegin":
        setPoints(serverEvent.totalPoints);
        setSubpage("ChooseAnswer");
        setSubpageData(serverEvent);
        break;
      case "roundEnd":
        setPoints(serverEvent.totalPoints);
        setSubpage("Result");
        setSubpageData(serverEvent);
        break;
    }
  };

  openSocketRef.current = (request, mode) =>
    new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(getWebSocketUrl());
      pendingSocketRef.current = socket;
      let connected = false;
      let settled = false;

      const openTimeout = window.setTimeout(() => {
        if (connected) return;
        settled = true;
        socket.close();
        reject(new Error("Connection timeout"));
      }, SOCKET_OPEN_TIMEOUT_MS);

      const rejectOnce = (cause: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(openTimeout);
        reject(cause);
      };

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify(request));
      });

      socket.addEventListener("message", (message) => {
        lastServerMessageAtRef.current = Date.now();
        let serverEvent: UserEvent.event;
        try {
          serverEvent = JSON.parse(String(message.data)) as UserEvent.event;
        } catch {
          return;
        }

        if (serverEvent.type === "joinFailed") {
          rejectOnce(new Error(serverEvent.reason));
          socket.close();
          return;
        }

        if (serverEvent.type === "joined") {
          connected = true;
          settled = true;
          window.clearTimeout(openTimeout);
          const session: PlayerSession = {
            roomId: request.roomId,
            username: request.username,
            sessionToken: serverEvent.sessionToken,
          };
          sessionRef.current = session;
          socketRef.current = socket;
          pendingSocketRef.current = null;
          reconnectAttemptRef.current = 0;
          setUsername(session.username);
          setConnectionStatus("connected");
          window.sessionStorage.setItem(
            PLAYER_SESSION_KEY,
            JSON.stringify(session)
          );
          setSubpage("LobbyWaiting");
          resolve();
          return;
        }

        handleEventRef.current(serverEvent);
      });

      socket.addEventListener("error", () => {
        if (!connected) rejectOnce(new Error("Connection error"));
      });

      socket.addEventListener("close", () => {
        window.clearTimeout(openTimeout);
        if (pendingSocketRef.current === socket) pendingSocketRef.current = null;
        if (socketRef.current === socket) socketRef.current = null;

        if (!connected) {
          rejectOnce(new Error("Connection closed"));
          return;
        }

        if (
          mountedRef.current &&
          !stoppedRef.current &&
          !gameFinishedRef.current &&
          sessionRef.current
        ) {
          reconnectRef.current();
        }
      });
    });

  reconnectRef.current = () => {
    if (
      !mountedRef.current ||
      stoppedRef.current ||
      gameFinishedRef.current ||
      !sessionRef.current ||
      pendingSocketRef.current
    ) {
      return;
    }

    setConnectionStatus("reconnecting");
    if (reconnectTimerRef.current !== null) return;

    const attempt = reconnectAttemptRef.current;
    const delay =
      attempt === 0
        ? 250
        : Math.min(8_000, 500 * 2 ** Math.min(attempt - 1, 4)) +
          Math.floor(Math.random() * 250);
    reconnectAttemptRef.current += 1;
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      const session = sessionRef.current;
      if (!session) return;
      const request: action.ResumeRoom = {
        type: "resumeRoom",
        roomId: session.roomId,
        username: session.username,
        sessionToken: session.sessionToken,
      };
      void openSocketRef
        .current(request, "resume")
        .catch((cause) => {
          const reason = cause instanceof Error ? cause.message : "";
          if (reason === "Invalid session" || reason === "Room does not exist") {
            sessionRef.current = null;
            window.sessionStorage.removeItem(PLAYER_SESSION_KEY);
            setConnectionStatus("idle");
            setSubpage("StartScreen");
            setSubpageData(null);
            setConnectionError(
              "Não foi possível recuperar a partida. Entre novamente em uma sala."
            );
            return;
          }
          reconnectRef.current();
        });
    }, delay);
  };

  useEffect(() => {
    mountedRef.current = true;
    stoppedRef.current = false;

    const savedSession = window.sessionStorage.getItem(PLAYER_SESSION_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession) as PlayerSession;
        if (
          Number.isInteger(session.roomId) &&
          session.username &&
          session.sessionToken
        ) {
          sessionRef.current = session;
          setUsername(session.username);
          reconnectRef.current();
        } else {
          window.sessionStorage.removeItem(PLAYER_SESSION_KEY);
        }
      } catch {
        window.sessionStorage.removeItem(PLAYER_SESSION_KEY);
      }
    }

    const watchdog = window.setInterval(() => {
      const socket = socketRef.current;
      if (
        socket?.readyState === WebSocket.OPEN &&
        lastServerMessageAtRef.current > 0 &&
        Date.now() - lastServerMessageAtRef.current > SOCKET_STALE_AFTER_MS
      ) {
        socket.close(4000, "Server heartbeat timeout");
      }
    }, 5_000);

    const reconnectNow = () => {
      const socket = socketRef.current;
      if (
        sessionRef.current &&
        (!socket || socket.readyState !== WebSocket.OPEN)
      ) {
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        reconnectAttemptRef.current = 0;
        reconnectRef.current();
      }
    };
    window.addEventListener("online", reconnectNow);
    document.addEventListener("visibilitychange", reconnectNow);

    return () => {
      mountedRef.current = false;
      stoppedRef.current = true;
      window.clearInterval(watchdog);
      window.removeEventListener("online", reconnectNow);
      document.removeEventListener("visibilitychange", reconnectNow);
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
      pendingSocketRef.current?.close();
    };
  }, []);

  async function joinRoom(roomId: number, playerName: string) {
    stoppedRef.current = false;
    gameFinishedRef.current = false;
    sessionRef.current = null;
    window.sessionStorage.removeItem(PLAYER_SESSION_KEY);
    setConnectionStatus("connecting");
    setConnectionError("");
    const request: action.JoinRoom = {
      type: "joinRoom",
      roomId,
      username: playerName,
    };
    try {
      await openSocketRef.current(request, "join");
    } catch (cause) {
      setConnectionStatus("idle");
      throw cause;
    }
  }

  function sendAction(request: action.Answer) {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      reconnectRef.current();
      return false;
    }
    socket.send(JSON.stringify(request));
    return true;
  }

  function joinAnotherRoom() {
    stoppedRef.current = true;
    gameFinishedRef.current = false;
    socketRef.current?.close();
    socketRef.current = null;
    sessionRef.current = null;
    window.sessionStorage.removeItem(PLAYER_SESSION_KEY);
    void router
      .replace("/play", undefined, { shallow: true })
      .then(() => {
        setPoints(0);
        setSubpageData(null);
        setUsername("");
        setConnectionStatus("idle");
        setSubpage("StartScreen");
        stoppedRef.current = false;
      })
      .catch(() => window.location.assign("/play"));
  }

  function leaveCurrentRoom() {
    setLeaveConfirmationOpen(false);
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      const request: action.LeaveRoom = { type: "leaveRoom" };
      socket.send(JSON.stringify(request));
    }
    joinAnotherRoom();
  }

  return (
    <PlayerContext.Provider
      value={{
        points,
        username,
        setUsername,
        setSubpage,
        connectionStatus,
        joinRoom,
        sendAction,
        requestLeave: () => setLeaveConfirmationOpen(true),
      }}
    >
      <>
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
        <NoticeModal
          open={leaveConfirmationOpen}
          title="Sair da sala?"
          messages={[
            "Você deixará esta partida e poderá entrar em outra sala.",
          ]}
          tone="warning"
          closeLabel="Continuar jogando"
          actionLabel="Sair da sala"
          actionTone="danger"
          onClose={() => setLeaveConfirmationOpen(false)}
          onAction={leaveCurrentRoom}
        />
        <NoticeModal
          open={connectionError !== ""}
          title="Conexão encerrada"
          messages={connectionError ? [connectionError] : []}
          tone="error"
          onClose={() => setConnectionError("")}
        />
      </>
    </PlayerContext.Provider>
  );
}

export default Play;

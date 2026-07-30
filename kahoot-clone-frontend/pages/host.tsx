import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "@styles/host.module.css";
import { IoMdPerson } from "react-icons/io";
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
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { getWebSocketUrl } from "@lib/websocket";
import NoticeModal from "@components/NoticeModal";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";

const HostContext = React.createContext<Context>(null);
type Players = { username: string; points: number }[];

interface Context {
  roomId: number;
  game: db.KahootGame;
  socket: WebSocket;
  players: Players;
  setPlayers: React.Dispatch<React.SetStateAction<Players>>;
  setPhase: React.Dispatch<
    React.SetStateAction<"lobby" | "questions" | "finished">
  >;
  gameFinishedRef: React.MutableRefObject<boolean>;
}

function formatPin(roomId: number) {
  const value = String(roomId).padStart(6, "0");
  return `${value.slice(0, 3)} ${value.slice(3, 6)}`;
}

function HostTopbar({
  action,
  onAction,
}: {
  action: string;
  onAction: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateFullscreenState = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (cause) {
      console.error("Não foi possível alterar o modo de tela cheia", cause);
    }
  }

  return (
    <header className={styles.hostTopbar}>
      <Image
        src="/kahootLogo.svg"
        width={116}
        height={40}
        alt="Kahoot!"
        priority
      />
      <p>Abra no celular e participe da partida.</p>
      <div className={styles.hostTopbarActions}>
        <button
          type="button"
          className={styles.fullscreenButton}
          onClick={() => void toggleFullscreen()}
          aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
          title={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
        >
          {isFullscreen ? (
            <FiMinimize2 aria-hidden="true" />
          ) : (
            <FiMaximize2 aria-hidden="true" />
          )}
          <span>{isFullscreen ? "Sair da tela cheia" : "Tela cheia"}</span>
        </button>
        <button type="button" onClick={onAction}>
          {action}
        </button>
      </div>
    </header>
  );
}

function JoinHeader() {
  const { roomId } = useContext(HostContext);
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const playUrl =
    configuredUrl ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <>
      <HostTopbar
        action="Recomeçar"
        onAction={() => window.location.assign("/profile")}
      />
      <section className={styles.pinStage} aria-label="Dados da sala">
        <div className={styles.pinCopy}>
          <span>Game Pin:</span>
          <strong>{formatPin(roomId)}</strong>
          <p>
            Acesse <b>{playUrl ? `${playUrl}/play` : "/play"}</b>
          </p>
        </div>
        <div
          className={styles.qrCard}
          aria-label="QR Code para acessar o jogo"
        >
          <QRCodeSVG
            value={`${playUrl}/play`}
            size={640}
            className={styles.qrCode}
            bgColor="#ffffff"
            fgColor="#25144f"
            level="M"
            marginSize={2}
            title="QR Code para entrar na sala"
          />
          <span>Escaneie para entrar</span>
        </div>
      </section>
    </>
  );
}

function Lobby() {
  const { socket, players, setPlayers, setPhase } = useContext(HostContext);

  useEffect(() => {
    const aborter = new AbortController();
    socket.addEventListener(
      "message",
      (event) => {
        const hostEvent = JSON.parse(event.data) as HostEvent.Event;
        switch (hostEvent.type) {
          case "userJoined":
            setPlayers((current) => [
              ...current,
              { username: hostEvent.username, points: 0 },
            ]);
            break;
          case "userLeft":
            setPlayers((current) =>
              current.filter(
                (player) => player.username !== hostEvent.username
              )
            );
            break;
        }
      },
      { signal: aborter.signal }
    );
    return () => aborter.abort();
  }, [setPlayers, socket]);

  return (
    <section className={styles.lobby}>
      <div className={styles.lobbyToolbar}>
        <div className={styles.lobbyPeople}>
          <IoMdPerson aria-hidden="true" />
          <span>{players.length}</span>
          <small>{players.length === 1 ? "jogador" : "jogadores"}</small>
        </div>
        <button
          type="button"
          className={styles.startButton}
          disabled={players.length === 0}
          onClick={() => setPhase("questions")}
        >
          Começar
        </button>
      </div>

      <div className={styles.lobbyContent}>
        <div className={styles.pulse} aria-hidden="true">
          <span />
        </div>
        <h1>
          {players.length === 0
            ? "Aguardando jogadores"
            : "Sala pronta para começar"}
        </h1>
        <p>
          {players.length === 0
            ? "Os nomes aparecerão aqui assim que entrarem."
            : "Confira os participantes e inicie quando quiser."}
        </p>
        <div className={styles.lobbyUserContainer}>
          {players.map((player) => (
            <span key={player.username} className={styles.lobbyUser}>
              {player.username}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

interface QuestionDisplayProps {
  question: rustServerQuestion;
  showAnswer: boolean;
  nextScreenHandler: () => void;
  timeLeft: number;
  answered: number;
}

function AnswerShape({ index }: { index: number }) {
  if (index === 0) return <BsFillTriangleFill aria-hidden="true" />;
  if (index === 1)
    return (
      <BsFillSquareFill className={qStyles.diamond} aria-hidden="true" />
    );
  if (index === 2) return <BsFillCircleFill aria-hidden="true" />;
  return <BsFillSquareFill aria-hidden="true" />;
}

function CheckboxCircle() {
  return (
    <span className={qStyles.correctMarker} aria-label="Resposta correta">
      <FaCheck aria-hidden="true" />
    </span>
  );
}

function QuestionDisplay({
  question,
  showAnswer,
  nextScreenHandler,
  answered,
  timeLeft,
}: QuestionDisplayProps) {
  const { players, roomId } = useContext(HostContext);
  const colors = [qStyles.red, qStyles.blue, qStyles.yellow, qStyles.green];

  return (
    <main className={qStyles.screen}>
      <header className={qStyles.topbar}>
        <strong>Kahoot!</strong>
        <div className={qStyles.sessionData}>
          <span>PIN {formatPin(roomId)}</span>
          <span>
            <IoMdPerson aria-hidden="true" /> {players.length}
          </span>
        </div>
        <button type="button" onClick={nextScreenHandler}>
          Próximo
        </button>
      </header>

      <section className={qStyles.container}>
        <div className={qStyles.statusRow}>
          <div className={qStyles.timerBubble}>
            <span>{timeLeft}</span>
            <small>seg</small>
          </div>
          <div className={qStyles.answerNotifier}>
            <strong>{answered}</strong>
            <span>{answered === 1 ? "resposta" : "respostas"}</span>
          </div>
        </div>

        <div className={qStyles.questionPresentation}>
          <h1 className={qStyles.question}>{question.question}</h1>
          {question.image && (
            <img
              className={qStyles.questionImage}
              src={question.image}
              alt={`Imagem da pergunta: ${question.question}`}
            />
          )}
        </div>

        <div className={qStyles.grid}>
          {question.choices.map((choice, index) => {
            if (!choice) return null;
            const correct = question.answer === index;
            return (
              <article
                className={`${qStyles.wrapper} ${colors[index]} ${
                  showAnswer && !correct ? qStyles.incorrect : ""
                }`}
                key={`${choice}-${index}`}
              >
                <span className={qStyles.shapeContainer}>
                  <AnswerShape index={index} />
                </span>
                <p className={qStyles.answer}>{choice}</p>
                {showAnswer && correct && <CheckboxCircle />}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Leaderboard({
  nextScreenHandler,
}: {
  nextScreenHandler: () => void;
}) {
  const { players, roomId } = useContext(HostContext);
  const ranking = [...players].sort((a, b) => b.points - a.points);

  return (
    <main className={styles.rankingScreen}>
      <HostTopbar action="Próximo" onAction={nextScreenHandler} />
      <section className={styles.rankingContent}>
        <span className={styles.eyebrow}>PIN {formatPin(roomId)}</span>
        <h1>Classificação:</h1>
        <p>Placar atualizado após esta pergunta.</p>
        <div className={styles.leaderboard}>
          {ranking.map((user, index) => (
            <div className={styles.leaderboardUser} key={user.username}>
              <span className={styles.position}>{index + 1}</span>
              <strong>{user.username}</strong>
              <span>{user.points} pontos</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function QuestionsPhase() {
  const { players, setPhase, setPlayers, socket, gameFinishedRef } =
    useContext(HostContext);
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
    const aborter = new AbortController();
    socket.addEventListener(
      "message",
      (event) => {
        const hostEvent = JSON.parse(event.data) as HostEvent.Event;
        switch (hostEvent.type) {
          case "roundBegin":
            setQuestion(hostEvent.question);
            setSubscreen("question");
            setAnswered([]);
            break;
          case "roundEnd":
            setPlayers((current) => {
              const copy = current.map((player) => ({ ...player }));
              Object.entries(hostEvent.pointGains).forEach(
                ([username, pointGain]) => {
                  const player = copy.find(
                    (item) => item.username === username
                  );
                  if (player) player.points += pointGain;
                }
              );
              return copy;
            });
            setTimer((current) => {
              clearInterval(current.timer);
              return { timeLeft: 0, timer: 0 };
            });
            setSubscreen("results");
            break;
          case "userAnswered":
            setAnswered((current) => [...current, hostEvent.username]);
            break;
          case "gameEnd":
            gameFinishedRef.current = true;
            setPhase("finished");
            break;
          case "userJoined":
            setPlayers((current) => [
              ...current,
              { username: hostEvent.username, points: 0 },
            ]);
            break;
          case "userLeft":
            break;
        }
      },
      { signal: aborter.signal }
    );

    const startGameRequest: action.BeginRound = { type: "beginRound" };
    socket.send(JSON.stringify(startGameRequest));
    return () => aborter.abort();
  }, [gameFinishedRef, setPhase, setPlayers, socket]);

  useEffect(() => {
    if (!question) return;
    let timeLeft = question.time;
    setTimer((current) => ({ ...current, timeLeft }));

    const timerId = window.setInterval(() => {
      if (timeLeft === 0) {
        window.clearInterval(timerId);
        const endRoundRequest: action.EndRound = { type: "endRound" };
        socket.send(JSON.stringify(endRoundRequest));
        return;
      }
      timeLeft -= 1;
      setTimer({ timeLeft, timer: timerId });
    }, 1000);

    setTimer({ timer: timerId, timeLeft });
    return () => window.clearInterval(timerId);
  }, [question, socket]);

  if (!question) {
    return (
      <main className={styles.loadingScreen}>
        <span className="appSpinner" />
        <p>Preparando a primeira pergunta...</p>
      </main>
    );
  }

  function nextScreenHandler() {
    switch (subscreen) {
      case "question": {
        clearInterval(timer.timer);
        const endRoundRequest: action.EndRound = { type: "endRound" };
        socket.send(JSON.stringify(endRoundRequest));
        break;
      }
      case "results":
        setSubscreen("leaderboard");
        break;
      case "leaderboard": {
        const beginRoundRequest: action.BeginRound = { type: "beginRound" };
        socket.send(JSON.stringify(beginRoundRequest));
        break;
      }
    }
  }

  return (
    <>
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
          showAnswer
          nextScreenHandler={nextScreenHandler}
          timeLeft={timer.timeLeft}
          answered={answered.length}
        />
      )}
      {subscreen === "leaderboard" && (
        <Leaderboard nextScreenHandler={nextScreenHandler} />
      )}
    </>
  );
}

function StartScreen() {
  return (
    <main className={styles.startScreenContainer}>
      <JoinHeader />
      <Lobby />
    </main>
  );
}

function FinishedScreen() {
  const { players } = useContext(HostContext);
  const ranking = [...players].sort((a, b) => b.points - a.points);

  return (
    <main className={styles.rankingScreen}>
      <HostTopbar
        action="Meus quizzes"
        onAction={() => window.location.assign("/profile")}
      />
      <section className={styles.rankingContent}>
        <span className={styles.eyebrow}>Partida concluída</span>
        <h1>Resultado final</h1>
        <p>Obrigado por jogar. Aqui está o pódio da partida.</p>
        <div className={styles.leaderboard}>
          {ranking.map((player, index) => (
            <div className={styles.leaderboardUser} key={player.username}>
              <span className={styles.position}>{index + 1}</span>
              <strong>{player.username}</strong>
              <span>{player.points} pontos</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.playAgainButton}
          onClick={() => window.location.assign("/profile")}
        >
          Voltar aos meus quizzes
        </button>
      </section>
    </main>
  );
}

function Host() {
  const router = useRouter();
  const { loggedIn } = useUser();
  const [players, setPlayers] = useState<Players>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [game, setGame] = useState<db.KahootGame | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [connectionClosed, setConnectionClosed] = useState(false);
  const gameFinishedRef = useRef(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"lobby" | "questions" | "finished">(
    "lobby"
  );
  const gameId = router.query.gameId as string;

  useEffect(() => {
    if (!loggedIn || !router.isReady) return;

    const activeSocket = new WebSocket(getWebSocketUrl());
    const aborter = new AbortController();
    const socketPromise = new Promise<WebSocket>((resolve, reject) => {
      activeSocket.addEventListener("open", () => resolve(activeSocket), {
        signal: aborter.signal,
      });
      activeSocket.addEventListener("error", reject, {
        signal: aborter.signal,
      });
    });
    const gamePromise = postData<APIRequest, APIResponse>(
      "/api/getOneGame",
      { gameId },
      aborter.signal
    ).then((response) => {
      if (!("game" in response)) throw new Error(response.errorDescription);
      return response.game;
    });

    Promise.all([socketPromise, gamePromise])
      .then(([connectedSocket, loadedGame]) => {
        connectedSocket.addEventListener(
          "message",
          function roomListener(event) {
            const roomData = JSON.parse(event.data) as HostEvent.Event;
            if (roomData.type === "roomCreated") {
              setRoomId(roomData.roomId);
              setGame(loadedGame);
              setSocket(connectedSocket);
              connectedSocket.removeEventListener("message", roomListener);
              connectedSocket.onclose = () => {
                if (!gameFinishedRef.current) setConnectionClosed(true);
              };
            } else if (roomData.type === "roomCreationFailed") {
              setError("O quiz contém uma pergunta inválida.");
              connectedSocket.close();
            }
          }
        );
        connectedSocket.send(
          JSON.stringify({
            type: "createRoom",
            questions: loadedGame.questions.map((question) => {
              const formattedQuestion = { ...question } as any;
              formattedQuestion.answer = formattedQuestion.correctAnswer;
              delete formattedQuestion.correctAnswer;
              return formattedQuestion;
            }),
          })
        );
      })
      .catch((cause) => {
        console.error("Falha ao iniciar sala", cause);
        setError("Não foi possível iniciar a sala.");
        aborter.abort();
      });

    return () => {
      aborter.abort();
      activeSocket.close();
    };
  }, [gameId, loggedIn, router.isReady]);

  useEffect(() => {
    if (connectionClosed) {
      setError((current) => current || "A conexão com a partida foi encerrada.");
    }
  }, [connectionClosed]);

  if (error) {
    return (
      <>
        <main className={styles.loadingScreen}>
          <span className="appSpinner" />
          <p>Interrompendo a sala...</p>
        </main>
        <NoticeModal
          open
          title="Não foi possível continuar"
          messages={[error]}
          tone="error"
          closeLabel="Voltar aos meus quizzes"
          onClose={() => void router.push("/profile")}
        />
      </>
    );
  }

  if (!loggedIn || !router.isReady || !game || !socket || !roomId) {
    return (
      <main className={styles.loadingScreen}>
        <span className="appSpinner" />
        <p>Preparando sua sala...</p>
      </main>
    );
  }

  return (
    <HostContext.Provider
      value={{
        game,
        socket,
        roomId,
        players,
        setPlayers,
        setPhase,
        gameFinishedRef,
      }}
    >
      {phase === "lobby" && <StartScreen />}
      {phase === "questions" && <QuestionsPhase />}
      {phase === "finished" && <FinishedScreen />}
    </HostContext.Provider>
  );
}

export default Host;

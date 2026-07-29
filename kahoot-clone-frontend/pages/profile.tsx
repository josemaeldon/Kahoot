import Header from "@components/Header";
import NoticeModal from "@components/NoticeModal";
import styles from "@styles/profile.module.css";
import React, { useEffect, useState } from "react";
import useUser from "@lib/useSSRUser";
import type { db } from "../kahoot";
import { postData } from "@lib/postData";
import {
  APIRequest as GetGameReq,
  APIResponse as GetGameRes,
} from "./api/getGames";
import { useRouter } from "next/router";
import {
  APIRequest as DeleteGameReq,
  APIResponse as DeleteGameRes,
} from "./api/deleteOneGame";
import {
  FiCalendar,
  FiEdit2,
  FiHelpCircle,
  FiPlay,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

function Profile() {
  const { loggedIn, user } = useUser();
  const [data, setData] = useState<db.KahootGame[] | null>(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<db.KahootGame | null>(
    null
  );
  const router = useRouter();

  function getSetUserData() {
    setError("");
    postData<GetGameReq, GetGameRes>("/api/getGames", {
      type: "userId",
      userId: user._id,
    })
      .then((res) => {
        if (!("games" in res)) {
          setError(res.errorDescription);
        } else {
          setData(res.games);
        }
      })
      .catch(() => setError("Não foi possível carregar seus quizzes."));
  }

  useEffect(() => {
    if (loggedIn) getSetUserData();
  }, [loggedIn]);

  if (!loggedIn) return null;

  async function deletePendingGame() {
    if (!pendingDelete) return;

    const gameId = pendingDelete._id;
    setPendingDelete(null);
    try {
      const response = await postData<DeleteGameReq, DeleteGameRes>(
        "/api/deleteOneGame",
        { gameId }
      );
      if (response.error) {
        setError(response.errorDescription);
        return;
      }
      getSetUserData();
    } catch {
      setError("Não foi possível excluir o quiz.");
    }
  }

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.content}>
        <div className={styles.headingRow}>
          <div>
            <h1>Meus Kahoots</h1>
            <p>Crie, edite e inicie suas partidas.</p>
          </div>
          {data && data.length > 0 && (
            <button
              type="button"
              className={styles.createButton}
              onClick={() => void router.push("/create")}
            >
              <FiPlus aria-hidden="true" />
              Criar Kahoot
            </button>
          )}
        </div>

        {data === null && (
          <div className={styles.loadingState} aria-live="polite">
            <span className="appSpinner" />
            <p>Carregando seus quizzes...</p>
          </div>
        )}

        {data?.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <FiHelpCircle />
            </div>
            <h2>Você ainda não criou nenhum quiz.</h2>
            <p>Comece com uma pergunta e convide todo mundo para jogar.</p>
            <button
              type="button"
              className={styles.emptyButton}
              onClick={() => void router.push("/create")}
            >
              <FiPlus aria-hidden="true" />
              Criar meu primeiro quiz
            </button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className={styles.quizList}>
            {data.map((game) => (
              <article className={styles.quizRow} key={game._id}>
                <div className={styles.colorMark} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.quizInfo}>
                  <h2>{game.title}</h2>
                  <div className={styles.meta}>
                    <span>
                      <FiHelpCircle aria-hidden="true" />
                      {game.questions.length}{" "}
                      {game.questions.length === 1 ? "pergunta" : "perguntas"}
                    </span>
                    <span>
                      <FiCalendar aria-hidden="true" />
                      Criado em {new Date(game.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={() =>
                      void router.push({
                        pathname: "/host",
                        query: { gameId: game._id },
                      })
                    }
                  >
                    <FiPlay aria-hidden="true" />
                    Jogar
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Editar ${game.title}`}
                    onClick={() =>
                      void router.push({
                        pathname: "/create",
                        query: { editingId: game._id },
                      })
                    }
                  >
                    <FiEdit2 aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    aria-label={`Excluir ${game.title}`}
                    onClick={() => setPendingDelete(game)}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <NoticeModal
        open={error !== ""}
        title="Não foi possível continuar"
        messages={error ? [error] : []}
        tone="error"
        onClose={() => setError("")}
      />
      <NoticeModal
        open={pendingDelete !== null}
        title="Excluir quiz?"
        messages={[
          pendingDelete
            ? `“${pendingDelete.title}” será removido definitivamente.`
            : "",
        ]}
        tone="warning"
        closeLabel="Cancelar"
        actionLabel="Excluir"
        actionTone="danger"
        onClose={() => setPendingDelete(null)}
        onAction={() => void deletePendingGame()}
      />
    </main>
  );
}

export default Profile;

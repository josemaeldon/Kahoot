import Header from "@components/Header";
import FolderModal from "@components/FolderModal";
import NoticeModal from "@components/NoticeModal";
import styles from "@styles/profile.module.css";
import React, { useEffect, useState } from "react";
import useUser from "@lib/useSSRUser";
import type { db } from "../kahoot";
import { postData } from "@lib/postData";
import type {
  APIRequest as GetGamesRequest,
  APIResponse as GetGamesResponse,
} from "./api/getGames";
import type {
  APIRequest as FolderRequest,
  APIResponse as FolderResponse,
} from "./api/folders";
import type {
  APIRequest as LibraryRequest,
  APIResponse as LibraryResponse,
} from "./api/library";
import { useRouter } from "next/router";
import type {
  APIRequest as DeleteGameRequest,
  APIResponse as DeleteGameResponse,
} from "./api/deleteOneGame";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiFolder,
  FiFolderPlus,
  FiGlobe,
  FiHelpCircle,
  FiLock,
  FiPlay,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

type LibraryScope = "mine" | "public";
type FolderFilter = "all" | "unfiled" | string;
type PageSize = 10 | 20 | 50;

interface Pagination {
  page: number;
  pageSize: PageSize;
  total: number;
  totalPages: number;
}

interface FolderDialogState {
  mode: "create" | "rename";
  folder?: db.KahootFolder;
}

const initialPagination: Pagination = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

function Profile() {
  const { loggedIn } = useUser();
  const router = useRouter();
  const [scope, setScope] = useState<LibraryScope>("mine");
  const [games, setGames] = useState<db.KahootSummary[] | null>(null);
  const [folders, setFolders] = useState<db.KahootFolder[]>([]);
  const [ownedTotal, setOwnedTotal] = useState(0);
  const [unfiledCount, setUnfiledCount] = useState(0);
  const [selectedFolder, setSelectedFolder] =
    useState<FolderFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [pagination, setPagination] =
    useState<Pagination>(initialPagination);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [busyGameId, setBusyGameId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<db.KahootSummary | null>(null);
  const [pendingVisibility, setPendingVisibility] =
    useState<db.KahootSummary | null>(null);
  const [folderDialog, setFolderDialog] =
    useState<FolderDialogState | null>(null);
  const [folderSaving, setFolderSaving] = useState(false);
  const [pendingFolderDelete, setPendingFolderDelete] =
    useState<db.KahootFolder | null>(null);

  useEffect(() => {
    if (!loggedIn) return;

    const aborter = new AbortController();
    setGames(null);
    setError("");
    postData<GetGamesRequest, GetGamesResponse>(
      "/api/getGames",
      {
        scope,
        page,
        pageSize,
        folderId:
          scope === "mine" && selectedFolder !== "all"
            ? selectedFolder
            : null,
      },
      aborter.signal
    )
      .then((response) => {
        if (!("games" in response)) {
          setError(response.errorDescription);
          setGames([]);
          return;
        }
        setGames(response.games);
        setFolders(response.folders);
        setOwnedTotal(response.organization.totalCount);
        setUnfiledCount(response.organization.unfiledCount);
        setPagination(response.pagination);
      })
      .catch((cause) => {
        if ((cause as Error).name !== "AbortError") {
          setError("Não foi possível carregar os Kahoots.");
          setGames([]);
        }
      });

    return () => aborter.abort();
  }, [loggedIn, page, pageSize, refreshKey, scope, selectedFolder]);

  if (!loggedIn) return null;

  function refreshLibrary() {
    setRefreshKey((current) => current + 1);
  }

  function changeScope(nextScope: LibraryScope) {
    setScope(nextScope);
    setPage(1);
  }

  function chooseFolder(folder: FolderFilter) {
    setSelectedFolder(folder);
    setPage(1);
  }

  async function deletePendingGame() {
    if (!pendingDelete) return;

    const gameId = pendingDelete._id;
    setPendingDelete(null);
    setBusyGameId(gameId);
    try {
      const response = await postData<
        DeleteGameRequest,
        DeleteGameResponse
      >("/api/deleteOneGame", { gameId });
      if (response.error) {
        setError(response.errorDescription);
        return;
      }
      if (games?.length === 1 && page > 1) setPage((current) => current - 1);
      refreshLibrary();
    } catch {
      setError("Não foi possível excluir o Kahoot.");
    } finally {
      setBusyGameId(null);
    }
  }

  async function submitFolder(name: string) {
    if (!folderDialog) return;
    setFolderSaving(true);

    const request: FolderRequest =
      folderDialog.mode === "create"
        ? { action: "create", name }
        : {
            action: "rename",
            folderId: folderDialog.folder!.id,
            name,
          };

    try {
      const response = await postData<FolderRequest, FolderResponse>(
        "/api/folders",
        request
      );
      if (response.error) {
        setError(response.errorDescription);
        return;
      }
      setFolderDialog(null);
      if (
        folderDialog.mode === "create" &&
        "folder" in response &&
        response.folder
      ) {
        chooseFolder(response.folder.id);
      }
      refreshLibrary();
    } catch {
      setError("Não foi possível salvar a pasta.");
    } finally {
      setFolderSaving(false);
    }
  }

  async function deletePendingFolder() {
    if (!pendingFolderDelete) return;

    const folderId = pendingFolderDelete.id;
    setPendingFolderDelete(null);
    try {
      const response = await postData<FolderRequest, FolderResponse>(
        "/api/folders",
        { action: "delete", folderId }
      );
      if (response.error) {
        setError(response.errorDescription);
        return;
      }
      if (selectedFolder === folderId) chooseFolder("all");
      refreshLibrary();
    } catch {
      setError("Não foi possível excluir a pasta.");
    }
  }

  async function moveGame(gameId: string, folderId: string | null) {
    setBusyGameId(gameId);
    try {
      const response = await postData<LibraryRequest, LibraryResponse>(
        "/api/library",
        { action: "move", gameId, folderId }
      );
      if (response.error) {
        setError(response.errorDescription);
        return;
      }
      refreshLibrary();
    } catch {
      setError("Não foi possível mover o Kahoot.");
    } finally {
      setBusyGameId(null);
    }
  }

  async function updateVisibility() {
    if (!pendingVisibility) return;

    const game = pendingVisibility;
    const isPublic = !game.isPublic;
    setPendingVisibility(null);
    setBusyGameId(game._id);
    try {
      const response = await postData<LibraryRequest, LibraryResponse>(
        "/api/library",
        {
          action: "visibility",
          gameId: game._id,
          isPublic,
        }
      );
      if (response.error) {
        setError(response.errorDescription);
        return;
      }
      refreshLibrary();
    } catch {
      setError("Não foi possível alterar a visibilidade do Kahoot.");
    } finally {
      setBusyGameId(null);
    }
  }

  const selectedFolderData = folders.find(
    (folder) => folder.id === selectedFolder
  );
  const emptyTitle =
    scope === "public"
      ? "Nenhum Kahoot público disponível."
      : selectedFolder === "all" && ownedTotal === 0
        ? "Você ainda não criou nenhum Kahoot."
        : "Esta pasta ainda está vazia.";
  const emptyDescription =
    scope === "public"
      ? "Quando alguém publicar um Kahoot, ele aparecerá aqui."
      : selectedFolder === "all" && ownedTotal === 0
        ? "Comece com uma pergunta e convide todo mundo para jogar."
        : "Mova um Kahoot para cá ou crie um novo conteúdo.";

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.content}>
        <div className={styles.headingRow}>
          <div>
            <span className={styles.eyebrow}>Sua biblioteca</span>
            <h1>Meus Kahoots</h1>
            <p>Organize por tema, compartilhe e encontre tudo rapidamente.</p>
          </div>
          <button
            type="button"
            className={styles.createButton}
            onClick={() => void router.push("/create")}
          >
            <FiPlus aria-hidden="true" />
            Criar Kahoot
          </button>
        </div>

        <div className={styles.libraryTabs} role="tablist" aria-label="Biblioteca">
          <button
            type="button"
            role="tab"
            aria-selected={scope === "mine"}
            className={scope === "mine" ? styles.activeTab : ""}
            onClick={() => changeScope("mine")}
          >
            <FiFolder aria-hidden="true" />
            Meus Kahoots
            <span>{ownedTotal}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "public"}
            className={scope === "public" ? styles.activeTab : ""}
            onClick={() => changeScope("public")}
          >
            <FiGlobe aria-hidden="true" />
            Kahoots públicos
          </button>
        </div>

        <div
          className={`${styles.libraryShell} ${
            scope === "public" ? styles.publicLibrary : ""
          }`}
        >
          {scope === "mine" && (
            <aside className={styles.folderPanel} aria-label="Pastas">
              <div className={styles.folderPanelHeading}>
                <div>
                  <span>Organização</span>
                  <h2>Pastas</h2>
                </div>
                <button
                  type="button"
                  aria-label="Criar nova pasta"
                  title="Criar nova pasta"
                  onClick={() => setFolderDialog({ mode: "create" })}
                >
                  <FiFolderPlus aria-hidden="true" />
                </button>
              </div>

              <nav className={styles.folderList} aria-label="Filtrar por pasta">
                <button
                  type="button"
                  className={selectedFolder === "all" ? styles.folderActive : ""}
                  onClick={() => chooseFolder("all")}
                >
                  <span><FiFolder aria-hidden="true" />Todos</span>
                  <strong>{ownedTotal}</strong>
                </button>
                <button
                  type="button"
                  className={
                    selectedFolder === "unfiled" ? styles.folderActive : ""
                  }
                  onClick={() => chooseFolder("unfiled")}
                >
                  <span><FiFolder aria-hidden="true" />Sem pasta</span>
                  <strong>{unfiledCount}</strong>
                </button>
                {folders.map((folder) => (
                  <div className={styles.folderRow} key={folder.id}>
                    <button
                      type="button"
                      className={
                        selectedFolder === folder.id ? styles.folderActive : ""
                      }
                      onClick={() => chooseFolder(folder.id)}
                    >
                      <span><FiFolder aria-hidden="true" />{folder.name}</span>
                      <strong>{folder.gameCount}</strong>
                    </button>
                    <div className={styles.folderActions}>
                      <button
                        type="button"
                        aria-label={`Renomear pasta ${folder.name}`}
                        title="Renomear pasta"
                        onClick={() =>
                          setFolderDialog({ mode: "rename", folder })
                        }
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir pasta ${folder.name}`}
                        title="Excluir pasta"
                        onClick={() => setPendingFolderDelete(folder)}
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </nav>

              <button
                type="button"
                className={styles.newFolderButton}
                onClick={() => setFolderDialog({ mode: "create" })}
              >
                <FiPlus aria-hidden="true" />
                Nova pasta
              </button>
            </aside>
          )}

          <section className={styles.libraryContent}>
            <div className={styles.libraryToolbar}>
              <div>
                <span>
                  {scope === "public"
                    ? "Explorar conteúdos"
                    : selectedFolderData?.name ||
                      (selectedFolder === "unfiled"
                        ? "Sem pasta"
                        : "Todos os Kahoots")}
                </span>
                <strong>
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "Kahoot" : "Kahoots"}
                </strong>
              </div>
              <label>
                Exibir
                <select
                  aria-label="Quantidade de Kahoots por página"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as PageSize);
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                por página
              </label>
            </div>

            {games === null && (
              <div className={styles.loadingState} aria-live="polite">
                <span className="appSpinner" />
                <p>Carregando Kahoots...</p>
              </div>
            )}

            {games?.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon} aria-hidden="true">
                  {scope === "public" ? <FiGlobe /> : <FiFolder />}
                </div>
                <h2>{emptyTitle}</h2>
                <p>{emptyDescription}</p>
                {scope === "mine" && (
                  <button
                    type="button"
                    className={styles.emptyButton}
                    onClick={() => void router.push("/create")}
                  >
                    <FiPlus aria-hidden="true" />
                    Criar Kahoot
                  </button>
                )}
              </div>
            )}

            {games && games.length > 0 && (
              <>
                <div className={styles.quizGrid}>
                  {games.map((game) => {
                    const isBusy = busyGameId === game._id;
                    return (
                      <article className={styles.quizCard} key={game._id}>
                        <div className={styles.colorMark} aria-hidden="true">
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>
                        <div className={styles.cardContent}>
                          <div className={styles.badges}>
                            <span
                              className={
                                game.isPublic
                                  ? styles.publicBadge
                                  : styles.privateBadge
                              }
                            >
                              {game.isPublic ? <FiGlobe /> : <FiLock />}
                              {game.isPublic ? "Público" : "Privado"}
                            </span>
                            {game.folderName && (
                              <span className={styles.folderBadge}>
                                <FiFolder />
                                {game.folderName}
                              </span>
                            )}
                          </div>

                          <h2 title={game.title}>{game.title}</h2>
                          {scope === "public" && (
                            <p className={styles.author}>
                              Por <strong>{game.author_username}</strong>
                            </p>
                          )}
                          <div className={styles.meta}>
                            <span>
                              <FiHelpCircle aria-hidden="true" />
                              {game.questionCount}{" "}
                              {game.questionCount === 1 ? "pergunta" : "perguntas"}
                            </span>
                            <span>
                              <FiCalendar aria-hidden="true" />
                              {new Date(game.date).toLocaleDateString("pt-BR")}
                            </span>
                          </div>

                          {scope === "mine" && (
                            <div className={styles.organizer}>
                              <label>
                                <span className={styles.srOnly}>
                                  Pasta de {game.title}
                                </span>
                                <select
                                  aria-label={`Pasta de ${game.title}`}
                                  value={game.folderId || ""}
                                  disabled={isBusy}
                                  onChange={(event) =>
                                    void moveGame(
                                      game._id,
                                      event.target.value || null
                                    )
                                  }
                                >
                                  <option value="">Sem pasta</option>
                                  {folders.map((folder) => (
                                    <option value={folder.id} key={folder.id}>
                                      {folder.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <button
                                type="button"
                                className={styles.visibilityButton}
                                disabled={isBusy}
                                onClick={() => setPendingVisibility(game)}
                              >
                                {game.isPublic ? <FiLock /> : <FiGlobe />}
                                {game.isPublic
                                  ? "Tornar privado"
                                  : "Publicar"}
                              </button>
                            </div>
                          )}
                        </div>

                        <footer className={styles.cardActions}>
                          <button
                            type="button"
                            className={styles.playButton}
                            disabled={isBusy}
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
                          {scope === "mine" && (
                            <>
                              <button
                                type="button"
                                className={styles.iconButton}
                                aria-label={`Editar ${game.title}`}
                                disabled={isBusy}
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
                                disabled={isBusy}
                                onClick={() => setPendingDelete(game)}
                              >
                                <FiTrash2 aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </footer>
                      </article>
                    );
                  })}
                </div>

                <div className={styles.pagination}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    <FiChevronLeft aria-hidden="true" />
                    Anterior
                  </button>
                  <span>
                    Página <strong>{pagination.page}</strong> de{" "}
                    <strong>{pagination.totalPages}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Próxima
                    <FiChevronRight aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </section>

      <FolderModal
        open={folderDialog !== null}
        title={
          folderDialog?.mode === "rename" ? "Renomear pasta" : "Criar pasta"
        }
        initialName={folderDialog?.folder?.name || ""}
        pending={folderSaving}
        onClose={() => setFolderDialog(null)}
        onSubmit={(name) => void submitFolder(name)}
      />
      <NoticeModal
        open={error !== ""}
        title="Não foi possível continuar"
        messages={error ? [error] : []}
        tone="error"
        onClose={() => setError("")}
      />
      <NoticeModal
        open={pendingDelete !== null}
        title="Excluir Kahoot?"
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
      <NoticeModal
        open={pendingVisibility !== null}
        title={
          pendingVisibility?.isPublic
            ? "Tornar este Kahoot privado?"
            : "Publicar este Kahoot?"
        }
        messages={[
          pendingVisibility?.isPublic
            ? "Somente você poderá encontrar e iniciar este Kahoot."
            : "Todos os usuários poderão encontrar e iniciar este Kahoot na biblioteca pública.",
        ]}
        tone="info"
        closeLabel="Cancelar"
        actionLabel={pendingVisibility?.isPublic ? "Tornar privado" : "Publicar"}
        onClose={() => setPendingVisibility(null)}
        onAction={() => void updateVisibility()}
      />
      <NoticeModal
        open={pendingFolderDelete !== null}
        title="Excluir pasta?"
        messages={[
          pendingFolderDelete
            ? `A pasta “${pendingFolderDelete.name}” será excluída. Os Kahoots continuarão salvos em “Sem pasta”.`
            : "",
        ]}
        tone="warning"
        closeLabel="Cancelar"
        actionLabel="Excluir pasta"
        actionTone="danger"
        onClose={() => setPendingFolderDelete(null)}
        onAction={() => void deletePendingFolder()}
      />
    </main>
  );
}

export default Profile;

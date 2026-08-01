import Header from "@components/Header";
import FolderModal from "@components/FolderModal";
import NoticeModal from "@components/NoticeModal";
import SelectField from "@components/SelectField";
import PlaySettings from "@components/PlaySettings";
import styles from "@styles/profile.module.css";
import React, { useEffect, useState } from "react";
import useUser from "@lib/useSSRUser";
import type { db } from "../play";
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
import type { APIResponse as CategoriesResponse } from "./api/categories";
import type { CurrentPlan, PlansResponse } from "./api/plans";
import {
  FiCalendar,
  FiCreditCard,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiFolder,
  FiFolderPlus,
  FiGlobe,
  FiHelpCircle,
  FiLock,
  FiPlay,
  FiPlus,
  FiTag,
  FiTrash2,
} from "react-icons/fi";

type LibraryScope = "mine" | "public" | "categories" | "config";
type FolderFilter = "all" | "unfiled" | string;
type PageSize = 10 | 20 | 50;
type PublicSort = "newest" | "oldest";

interface Pagination {
  page: number;
  pageSize: PageSize;
  total: number;
  totalPages: number;
}

interface FolderDialogState {
  mode: "create" | "rename";
  folder?: db.PlayFolder;
}

interface CategoryDialogState {
  mode: "create" | "rename";
  category?: db.PlayCategory;
}

const initialPagination: Pagination = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

function Profile() {
  const { loggedIn, user } = useUser();
  const router = useRouter();
  const [scope, setScope] = useState<LibraryScope>("mine");
  const [games, setGames] = useState<db.PlaySummary[] | null>(null);
  const [folders, setFolders] = useState<db.PlayFolder[]>([]);
  const [categories, setCategories] = useState<db.PlayCategory[]>([]);
  const [publicAuthors, setPublicAuthors] = useState<db.PlayAuthor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [publicSort, setPublicSort] = useState<PublicSort>("newest");
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
    useState<db.PlaySummary | null>(null);
  const [pendingVisibility, setPendingVisibility] =
    useState<db.PlaySummary | null>(null);
  const [folderDialog, setFolderDialog] =
    useState<FolderDialogState | null>(null);
  const [folderSaving, setFolderSaving] = useState(false);
  const [pendingFolderDelete, setPendingFolderDelete] =
    useState<db.PlayFolder | null>(null);
  const [categoryDialog, setCategoryDialog] =
    useState<CategoryDialogState | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [pendingCategoryDelete, setPendingCategoryDelete] =
    useState<db.PlayCategory | null>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    if (scope === "categories" || scope === "config") return;

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
        categoryId:
          scope === "public" && selectedCategory !== "all"
            ? selectedCategory
            : null,
        authorId:
          scope === "public" && selectedAuthor !== "all"
            ? selectedAuthor
            : null,
        sort: publicSort,
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
        setPublicAuthors(response.publicAuthors);
      })
      .catch((cause) => {
        if ((cause as Error).name !== "AbortError") {
          setError("Não foi possível carregar os Plays!");
          setGames([]);
        }
      });

    return () => aborter.abort();
  }, [
    loggedIn,
    page,
    pageSize,
    publicSort,
    refreshKey,
    scope,
    selectedAuthor,
    selectedCategory,
    selectedFolder,
  ]);

  useEffect(() => {
    if (!loggedIn) return;
    const aborter = new AbortController();
    fetch("/api/categories", {
      credentials: "same-origin",
      cache: "no-store",
      signal: aborter.signal,
    })
      .then((response) => response.json() as Promise<CategoriesResponse>)
      .then((response) => {
        if ("categories" in response) setCategories(response.categories);
      })
      .catch((cause) => {
        if ((cause as Error).name !== "AbortError") {
          setError("Não foi possível carregar as categorias.");
        }
      });
    return () => aborter.abort();
  }, [loggedIn, refreshKey]);

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/plans", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.json() as Promise<PlansResponse>)
      .then((response) => {
        if ("currentPlan" in response) setCurrentPlan(response.currentPlan);
      })
      .catch(() => undefined);
  }, [loggedIn]);

  useEffect(() => {
    if (router.isReady && router.query.scope === "public") {
      setScope("public");
    }
  }, [router.isReady, router.query.scope]);

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

  function changeCategory(categoryId: string) {
    setSelectedCategory(categoryId);
    setPage(1);
  }

  function changeAuthor(authorId: string) {
    setSelectedAuthor(authorId);
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
      setError("Não foi possível excluir o Play!");
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
      setError("Não foi possível mover o Play!");
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
      setError("Não foi possível alterar a visibilidade do Play!");
    } finally {
      setBusyGameId(null);
    }
  }

  async function submitCategory(name: string) {
    if (!categoryDialog) return;
    setCategorySaving(true);
    try {
      const response = await fetch("/api/categories", {
        method: categoryDialog.mode === "create" ? "POST" : "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          categoryDialog.mode === "create"
            ? { name }
            : { categoryId: categoryDialog.category!.id, name }
        ),
      });
      const payload = (await response.json()) as CategoriesResponse;
      if (!("categories" in payload)) {
        setError(payload.errorDescription);
        return;
      }
      setCategories(payload.categories);
      setCategoryDialog(null);
      refreshLibrary();
    } catch {
      setError("Não foi possível salvar a categoria.");
    } finally {
      setCategorySaving(false);
    }
  }

  async function deletePendingCategory() {
    if (!pendingCategoryDelete) return;
    const categoryId = pendingCategoryDelete.id;
    setPendingCategoryDelete(null);
    setCategorySaving(true);
    try {
      const response = await fetch("/api/categories", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      const payload = (await response.json()) as CategoriesResponse;
      if (!("categories" in payload)) {
        setError(payload.errorDescription);
        return;
      }
      setCategories(payload.categories);
      if (selectedCategory === categoryId) setSelectedCategory("all");
      refreshLibrary();
    } catch {
      setError("Não foi possível excluir a categoria.");
    } finally {
      setCategorySaving(false);
    }
  }

  const selectedFolderData = folders.find(
    (folder) => folder.id === selectedFolder
  );
  const emptyTitle =
    scope === "public"
      ? "Nenhum Play! público disponível."
      : selectedFolder === "all" && ownedTotal === 0
        ? "Você ainda não criou nenhum Play!"
        : "Esta pasta ainda está vazia.";
  const emptyDescription =
    scope === "public"
      ? "Um Play! publicado por outra pessoa aparecerá aqui."
      : selectedFolder === "all" && ownedTotal === 0
        ? "Comece com uma pergunta e convide todo mundo para jogar."
        : "Mova um Play! para cá ou crie um novo conteúdo.";

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.content}>
        <div className={styles.headingRow}>
          <div>
            <span className={styles.eyebrow}>Sua biblioteca</span>
            <h1>Meus Plays!</h1>
            <p>Organize por tema, compartilhe e encontre tudo rapidamente.</p>
          </div>
          <button
            type="button"
            className={styles.createButton}
            onClick={() => void router.push("/create")}
          >
            <FiPlus aria-hidden="true" />
            Criar Play!
          </button>
        </div>

        <div className={styles.profilePlan}>
          <FiCreditCard aria-hidden="true" />
          <div>
            <span>Plano atual</span>
            <strong>{currentPlan?.name || "Nenhum plano ativo"}</strong>
            <p>{currentPlan ? `${currentPlan.durationDays} dias · ${currentPlan.source === "subscription" ? "Assinatura ativa" : "Plano atribuído"}` : "Escolha um plano para liberar seu acesso completo."}</p>
          </div>
          <button type="button" onClick={() => void router.push("/plans")}>{currentPlan ? "Ver planos e upgrade" : "Conhecer planos"}</button>
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
            Meus Plays!
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
            Plays! públicos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "categories"}
            className={scope === "categories" ? styles.activeTab : ""}
            onClick={() => changeScope("categories")}
          >
            <FiTag aria-hidden="true" />
            Categorias
            <span>{categories.length}</span>
          </button>
          {user?.role === "superadmin" && (
            <button
              type="button"
              role="tab"
              aria-selected={scope === "config"}
              className={scope === "config" ? styles.activeTab : ""}
              onClick={() => changeScope("config")}
            >
              <FiClock aria-hidden="true" />
              Config Play
            </button>
          )}
        </div>

        {scope === "config" ? (
          <PlaySettings />
        ) : scope === "categories" ? (
          <section className={styles.categoryManager}>
            <div className={styles.categoryManagerHeading}>
              <div>
                <span>Organização por assunto</span>
                <h2>Gerenciar categorias</h2>
                <p>
                  {user?.role === "superadmin"
                    ? "Crie e gerencie as categorias disponíveis para os Plays!."
                    : "Escolha categorias disponíveis e organize seus Plays! em pastas pessoais."}
                </p>
              </div>
              {user?.role === "superadmin" && (
                <button
                  type="button"
                  className={styles.createButton}
                  onClick={() => setCategoryDialog({ mode: "create" })}
                >
                  <FiPlus aria-hidden="true" />
                  Nova categoria
                </button>
              )}
            </div>
            <div className={styles.categoryGrid}>
              {categories.map((category) => {
                const canManage =
                  user?.role === "superadmin" ||
                  (!category.isDefault && category.createdByMe);
                return (
                  <article className={styles.categoryCard} key={category.id}>
                    <div className={styles.categoryCardIcon}>
                      <FiTag aria-hidden="true" />
                    </div>
                    <div className={styles.categoryCardContent}>
                      <div>
                        <h3>{category.name}</h3>
                        <span>
                          {category.isDefault ? "Padrão" : "Personalizada"}
                        </span>
                      </div>
                      <p>
                        {category.gameCount}{" "}
                        {category.gameCount === 1 ? "Play!" : "Plays!"}
                      </p>
                    </div>
                    <div className={styles.categoryCardActions}>
                      {canManage ? (
                        <>
                          <button
                            type="button"
                            aria-label={`Editar categoria ${category.name}`}
                            title="Editar categoria"
                            disabled={categorySaving}
                            onClick={() =>
                              setCategoryDialog({
                                mode: "rename",
                                category,
                              })
                            }
                          >
                            <FiEdit2 aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir categoria ${category.name}`}
                            title="Excluir categoria"
                            disabled={categorySaving}
                            onClick={() => setPendingCategoryDelete(category)}
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <span>Somente leitura</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
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
                        : "Todos os Plays!")}
                </span>
                <strong>
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "Play!" : "Plays!"}
                </strong>
              </div>
              <div className={styles.filterControls}>
                {scope === "public" && (
                  <>
                    <label>
                      <span>Usuário</span>
                      <SelectField
                        density="compact"
                        containerClassName={styles.authorFilter}
                        aria-label="Filtrar Plays! por usuário"
                        value={selectedAuthor}
                        onChange={(event) => changeAuthor(event.target.value)}
                      >
                        <option value="all">Todos os usuários</option>
                        {publicAuthors.map((author) => (
                          <option value={author.id} key={author.id}>
                            {author.username} ({author.gameCount})
                          </option>
                        ))}
                      </SelectField>
                    </label>
                    <label>
                      <span>Categoria</span>
                      <SelectField
                        density="compact"
                        containerClassName={styles.categoryFilter}
                        aria-label="Filtrar Plays! por categoria"
                        value={selectedCategory}
                        onChange={(event) =>
                          changeCategory(event.target.value)
                        }
                      >
                        <option value="all">Todas as categorias</option>
                        {categories.map((category) => (
                          <option value={category.id} key={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </SelectField>
                    </label>
                    <label>
                      <span>Ordenar</span>
                      <SelectField
                        density="compact"
                        aria-label="Ordenar Plays! públicos"
                        value={publicSort}
                        onChange={(event) => {
                          setPublicSort(event.target.value as PublicSort);
                          setPage(1);
                        }}
                      >
                        <option value="newest">Mais recentes</option>
                        <option value="oldest">Mais antigos</option>
                      </SelectField>
                    </label>
                  </>
                )}
                <label>
                  <span>Exibir por página</span>
                  <SelectField
                    density="compact"
                    aria-label="Quantidade de Plays! por página"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value) as PageSize);
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </SelectField>
                </label>
              </div>
            </div>

            {games === null && (
              <div className={styles.loadingState} aria-live="polite">
                <span className="appSpinner" />
                <p>Carregando Plays!</p>
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
                    Criar Play!
                  </button>
                )}
              </div>
            )}

            {games && games.length > 0 && (
              <>
                <div className={styles.playGrid}>
                  {games.map((game) => {
                    const isBusy = busyGameId === game._id;
                    return (
                      <article className={styles.playCard} key={game._id}>
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
                            <span className={styles.categoryBadge}>
                              <FiTag />
                              {game.categoryName}
                            </span>
                            {game.isDefault && (
                              <span className={styles.defaultBadge}>
                                Padrão
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
                                <SelectField
                                  density="compact"
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
                                </SelectField>
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

                        <footer
                          className={`${styles.cardActions} ${
                            scope === "public" &&
                            user?.role === "superadmin"
                              ? styles.publicAdminActions
                              : ""
                          }`}
                        >
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
                          {scope === "public" &&
                            user?.role === "superadmin" && (
                              <>
                                <button
                                  type="button"
                                  className={styles.iconButton}
                                  aria-label={`Editar ${game.title}`}
                                  disabled={isBusy}
                                  onClick={() =>
                                    void router.push({
                                      pathname: "/create",
                                      query: {
                                        editingId: game._id,
                                        returnScope: "public",
                                      },
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
        )}
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
      <FolderModal
        open={categoryDialog !== null}
        kind="category"
        title={
          categoryDialog?.mode === "rename"
            ? "Editar categoria"
            : "Criar categoria"
        }
        initialName={categoryDialog?.category?.name || ""}
        pending={categorySaving}
        onClose={() => setCategoryDialog(null)}
        onSubmit={(name) => void submitCategory(name)}
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
        title="Excluir Play!?"
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
            ? "Tornar este Play! privado?"
            : "Publicar este Play!?"
        }
        messages={[
          pendingVisibility?.isPublic
            ? "Somente você poderá encontrar e iniciar este Play!"
            : "Todos os usuários poderão encontrar e iniciar este Play! na biblioteca pública.",
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
            ? `A pasta “${pendingFolderDelete.name}” será excluída. Os Plays! continuarão salvos em “Sem pasta”.`
            : "",
        ]}
        tone="warning"
        closeLabel="Cancelar"
        actionLabel="Excluir pasta"
        actionTone="danger"
        onClose={() => setPendingFolderDelete(null)}
        onAction={() => void deletePendingFolder()}
      />
      <NoticeModal
        open={pendingCategoryDelete !== null}
        title="Excluir categoria?"
        messages={[
          pendingCategoryDelete?.isDefault
            ? "Os Plays! padrão desta categoria serão excluídos. Os demais serão movidos para outra categoria."
            : "Os Plays! desta categoria serão movidos para outra categoria disponível.",
        ]}
        tone="warning"
        closeLabel="Cancelar"
        actionLabel="Excluir categoria"
        actionTone="danger"
        onClose={() => setPendingCategoryDelete(null)}
        onAction={() => void deletePendingCategory()}
      />
    </main>
  );
}

export default Profile;

import React, { useEffect, useState } from "react";
import styles from "../styles/create.module.css";
import AiPlayModal from "@components/AiPlayModal";
import Questions from "../Components/Questions";
import Image from "next/image";
import Editor from "../Components/Editor";
import Options from "../Components/Options";
import type { db } from "../play";
import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import { postData } from "@lib/postData";
import { APIResponse, APIRequest } from "./api/create";
import NoticeModal from "../Components/NoticeModal";
import FolderModal from "../Components/FolderModal";
import {
  APIResponse as GetGameRes,
  APIRequest as GetGameReq,
} from "./api/getOneGame";
import {
  FiArrowLeft,
  FiCpu,
  FiDownload,
  FiFileText,
  FiFolder,
  FiFolderPlus,
  FiGlobe,
  FiLock,
  FiPlus,
  FiSave,
  FiTag,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { PlayCsvError, parsePlayCsv } from "@lib/playCsv";
import type { APIResponse as CategoriesResponse } from "./api/categories";
import type {
  APIRequest as FolderRequest,
  APIResponse as FolderResponse,
} from "./api/folders";
import SelectField from "@components/SelectField";
import type { AiGenerationResponse } from "./api/ai/generate";
import type { APIResponse as PlaySettingsResponse } from "./api/play-settings";

interface Notice {
  title: string;
  messages: string[];
  tone: "warning" | "error" | "info";
}

export interface QuestionError {
  correctChoiceError: boolean;
  questionBlankError: boolean;
  choicesRequiredError: boolean;
  ignoreErrors: boolean;
}

interface FormErrorReport {
  titleBlankError: boolean;
  categoryBlankError: boolean;
  questionErrors: QuestionError[];
}

interface GameContextValue {
  game: db.PlayGame;
  setGame: React.Dispatch<React.SetStateAction<db.PlayGame>>;
  questionNumber: number;
  setQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
  formErrors: FormErrorReport | null;
  validateForm: (game: db.PlayGame) => void;
  validateFormAndIgnoreError: (
    game: db.PlayGame,
    questionIndex: number
  ) => void;
  defaultPlayTime: number;
}

const defaultGame: db.PlayGame = {
  _id: "",
  author_id: "",
  author_username: "",
  title: "",
  isPublic: false,
  categoryId: "",
  date: 0,
  questions: [
    {
      correctAnswer: 0,
      choices: ["", "", "", ""],
      question: "",
      image: null,
      time: 15,
    },
  ],
};

export const GameContext = React.createContext<GameContextValue>(null);

function getFormErrors(game: db.PlayGame): FormErrorReport {
  return {
    titleBlankError: game.title.trim() === "",
    categoryBlankError: game.categoryId === "",
    questionErrors: game.questions.map((question) => ({
      choicesRequiredError:
        question.choices[0].trim() === "" ||
        question.choices[1].trim() === "",
      correctChoiceError:
        question.choices[question.correctAnswer].trim() === "",
      questionBlankError: question.question.trim() === "",
      ignoreErrors: false,
    })),
  };
}

function getValidationMessages(formErrors: FormErrorReport) {
  const messages: string[] = [];

  if (formErrors.titleBlankError) {
    messages.push("Informe um título para o Play!");
  }
  if (formErrors.categoryBlankError) {
    messages.push("Selecione uma categoria para o Play!");
  }

  formErrors.questionErrors.forEach((questionError, index) => {
    const questionLabel = `Pergunta ${index + 1}`;
    if (questionError.questionBlankError) {
      messages.push(`${questionLabel}: escreva o enunciado.`);
    }
    if (questionError.choicesRequiredError) {
      messages.push(`${questionLabel}: preencha ao menos duas respostas.`);
    }
    if (questionError.correctChoiceError) {
      messages.push(
        `${questionLabel}: escolha uma resposta correta preenchida.`
      );
    }
  });

  return messages;
}

function Create() {
  const [game, setGame] = useState<db.PlayGame>(defaultGame);
  const [formErrors, setFormErrors] = useState<FormErrorReport | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [categories, setCategories] = useState<db.PlayCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [folders, setFolders] = useState<db.PlayFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [defaultPlayTime, setDefaultPlayTime] = useState(15);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderSaving, setFolderSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [pendingCategoryDelete, setPendingCategoryDelete] =
    useState<db.PlayCategory | null>(null);
  const { loggedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loggedIn) return;
    const aborter = new AbortController();
    setCategoriesLoading(true);
    fetch("/api/categories", {
      credentials: "same-origin",
      cache: "no-store",
      signal: aborter.signal,
    })
      .then((response) => response.json() as Promise<CategoriesResponse>)
      .then((response) => {
        if (!("categories" in response)) {
          throw new Error(response.errorDescription);
        }
        setCategories(response.categories);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setNotice({
            title: "Não foi possível carregar as categorias",
            messages: [(error as Error).message],
            tone: "error",
          });
        }
      })
      .finally(() => setCategoriesLoading(false));
    return () => aborter.abort();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    const aborter = new AbortController();
    fetch("/api/play-settings", {
      credentials: "same-origin",
      cache: "no-store",
      signal: aborter.signal,
    })
      .then((response) => response.json() as Promise<PlaySettingsResponse>)
      .then((response) => {
        if (!("defaultPlayTime" in response)) return;
        setDefaultPlayTime(response.defaultPlayTime);
        if (router.query.editingId) return;
        setGame((current) => {
          if (
            current._id ||
            current.questions.length !== 1 ||
            current.questions[0].question.trim() ||
            current.questions[0].time !== 15
          ) {
            return current;
          }
          return {
            ...current,
            questions: [{ ...current.questions[0], time: response.defaultPlayTime }],
          };
        });
      })
      .catch(() => undefined);
    return () => aborter.abort();
  }, [loggedIn, router.query.editingId]);

  useEffect(() => {
    if (!loggedIn) return;
    const aborter = new AbortController();
    setFoldersLoading(true);
    fetch("/api/folders", {
      credentials: "same-origin",
      cache: "no-store",
      signal: aborter.signal,
    })
      .then((response) => response.json() as Promise<FolderResponse>)
      .then((response) => {
        if ("folders" in response && response.folders) {
          setFolders(response.folders);
        }
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setNotice({
            title: "Não foi possível carregar as pastas",
            messages: ["Você poderá salvar o Play sem pasta."],
            tone: "warning",
          });
        }
      })
      .finally(() => setFoldersLoading(false));
    return () => aborter.abort();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn || !router.isReady || !router.query.editingId) return;

    postData<GetGameReq, GetGameRes>("/api/getOneGame", {
      gameId: router.query.editingId as string,
      ownerOnly: true,
    })
      .then((response) => {
        if (!("game" in response)) {
          setNotice({
            title: "Não foi possível carregar o Play!",
            messages: [response.errorDescription],
            tone: "error",
          });
          return;
        }
        setGame(response.game);
      })
      .catch(() =>
        setNotice({
          title: "Não foi possível carregar o Play!",
          messages: ["Verifique sua conexão e tente novamente em instantes."],
          tone: "error",
        })
      );
  }, [loggedIn, router.isReady, router.query.editingId]);

  if (!loggedIn) return null;

  function validateForm(gameToValidate: db.PlayGame) {
    setFormErrors(getFormErrors(gameToValidate));
  }

  function validateFormAndIgnoreError(
    gameToValidate: db.PlayGame,
    questionIndex: number
  ) {
    const nextErrors = getFormErrors(gameToValidate);
    nextErrors.questionErrors[questionIndex].ignoreErrors = true;
    setFormErrors(nextErrors);
  }

  async function createNewCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategorySaving(true);
    try {
      const response = await postData<{ name: string }, CategoriesResponse>(
        "/api/categories",
        { name }
      );
      if (!("categories" in response)) {
        setNotice({
          title: "Não foi possível criar a categoria",
          messages: [response.errorDescription],
          tone: "error",
        });
        return;
      }
      setCategories(response.categories);
      if (response.category) {
        setGame((current) => ({
          ...current,
          categoryId: response.category!.id,
        }));
      }
      setNewCategoryName("");
      setCreatingCategory(false);
    } catch {
      setNotice({
        title: "Não foi possível criar a categoria",
        messages: ["Verifique sua conexão e tente novamente."],
        tone: "error",
      });
    } finally {
      setCategorySaving(false);
    }
  }

  async function createNewFolder(name: string) {
    setFolderSaving(true);
    try {
      const response = await postData<FolderRequest, FolderResponse>(
        "/api/folders",
        { action: "create", name }
      );
      if (response.error) {
        setNotice({
          title: "Não foi possível criar a pasta",
          messages: [response.errorDescription],
          tone: "error",
        });
        return;
      }
      if (!("folder" in response) || !response.folder) {
        setNotice({
          title: "Não foi possível criar a pasta",
          messages: ["A pasta criada não foi retornada pelo servidor."],
          tone: "error",
        });
        return;
      }
      const folder = {
        ...response.folder,
        gameCount: response.folder.gameCount ?? 0,
      };
      setFolders((current) => [...current, folder]);
      setGame((current) => ({ ...current, folderId: folder.id }));
      setFolderDialogOpen(false);
    } catch {
      setNotice({
        title: "Não foi possível criar a pasta",
        messages: ["Verifique sua conexão e tente novamente."],
        tone: "error",
      });
    } finally {
      setFolderSaving(false);
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
        setNotice({
          title: "Não foi possível excluir a categoria",
          messages: [payload.errorDescription],
          tone: "error",
        });
        return;
      }
      setCategories(payload.categories);
      if (game.categoryId === categoryId) {
        setGame((current) => ({
          ...current,
          categoryId: payload.categories[0]?.id || "",
        }));
      }
    } catch {
      setNotice({
        title: "Não foi possível excluir a categoria",
        messages: ["Verifique sua conexão e tente novamente."],
        tone: "error",
      });
    } finally {
      setCategorySaving(false);
    }
  }

  async function saveGame() {
    const nextErrors = getFormErrors(game);
    setFormErrors(nextErrors);
    const validationMessages = getValidationMessages(nextErrors);

    if (validationMessages.length > 0) {
      setNotice({
        title: "Revise o Play!",
        messages: validationMessages,
        tone: "warning",
      });
      return;
    }

    setIsSaving(true);
    const editingId = router.query.editingId as string | undefined;
    try {
      const response =
        typeof editingId === "string"
          ? await postData<APIRequest, APIResponse>("/api/create", {
              game,
              game_id: editingId,
            })
          : await postData<APIRequest, APIResponse>("/api/create", { game });

      if (response.error) {
        setNotice({
          title: "Não foi possível salvar",
          messages: [response.errorDescription],
          tone: "error",
        });
        return;
      }
      await router.push(
        router.query.returnScope === "public"
          ? { pathname: "/profile", query: { scope: "public" } }
          : "/profile"
      );
    } catch {
      setNotice({
        title: "Não foi possível salvar",
        messages: ["Verifique sua conexão e tente novamente em instantes."],
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function importCsv(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setNotice({
        title: "Arquivo muito grande",
        messages: ["O CSV deve ter no máximo 1 MB e até 100 perguntas."],
        tone: "error",
      });
      return;
    }

    try {
      const importedGame = parsePlayCsv(await file.text());
      setGame((current) => ({
        ...importedGame,
        _id: current._id,
        author_id: current.author_id,
        author_username: current.author_username,
        isPublic: current.isPublic,
        categoryId: current.categoryId,
        date: current.date,
      }));
      setQuestionNumber(0);
      setFormErrors(null);
      setNotice({
        title: "Importação concluída",
        messages: [
          `${importedGame.questions.length} ${
            importedGame.questions.length === 1 ? "pergunta foi importada" : "perguntas foram importadas"
          }. Revise o conteúdo e adicione imagens antes de salvar.`,
        ],
        tone: "info",
      });
    } catch (error) {
      setNotice({
        title: "Não foi possível importar",
        messages: [
          error instanceof PlayCsvError
            ? error.message
            : "O arquivo não pôde ser lido. Baixe o modelo e tente novamente.",
        ],
        tone: "error",
      });
    }
  }

  async function generateWithAi(prompt: string, categoryId: string) {
    setAiGenerating(true);
    setAiError("");
    try {
      const response = await postData<
        { prompt: string; categoryId: string },
        AiGenerationResponse
      >("/api/ai/generate", { prompt, categoryId });
      if (!("game" in response)) {
        setAiError(response.errorDescription);
        return;
      }

      setGame((current) => ({
        ...current,
        title: response.game.title,
        categoryId,
        questions: response.game.questions,
      }));
      setQuestionNumber(0);
      setFormErrors(null);
      setAiModalOpen(false);
      setNotice({
        title: "Play! gerado",
        messages: [
          "As 10 perguntas foram adicionadas ao editor. Revise o conteúdo, selecione uma categoria e salve quando estiver pronto.",
        ],
        tone: "info",
      });
    } catch {
      setAiError("Não foi possível conectar ao gerador de IA.");
    } finally {
      setAiGenerating(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.brandButton}
          aria-label="Voltar para o início"
          onClick={() => void router.push("/")}
        >
          <Image
            src="/playLogo.svg"
            width={124}
            height={43}
            alt="Play!"
            priority
          />
        </button>
        <input
          className={`${styles.titleInput} ${
            formErrors?.titleBlankError ? styles.invalid : ""
          }`}
          type="text"
          placeholder="Digite o título do Play!"
          value={game.title}
          maxLength={120}
          onChange={(event) =>
            setGame((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
        />
        <div className={styles.topbarActions}>
          <button
            type="button"
            className={styles.exitButton}
            onClick={() => void router.push("/profile")}
          >
            <FiArrowLeft aria-hidden="true" />
            Sair
          </button>
          <button
            type="button"
            className={styles.saveButton}
            disabled={isSaving}
            onClick={() => void saveGame()}
          >
            <FiSave aria-hidden="true" />
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      <section className={styles.categoryBar} aria-label="Categoria do Play!">
        <div className={styles.categorySelector}>
          <FiTag aria-hidden="true" />
          <label htmlFor="play-category">Categoria</label>
          <SelectField
            id="play-category"
            containerClassName={styles.categorySelect}
            value={game.categoryId}
            disabled={categoriesLoading || categorySaving}
            className={
              formErrors?.categoryBlankError ? styles.invalid : ""
            }
            onChange={(event) =>
              setGame((current) => ({
                ...current,
                categoryId: event.target.value,
              }))
            }
          >
            <option value="">
              {categoriesLoading ? "Carregando..." : "Selecione uma categoria"}
            </option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
                {category.isDefault ? "" : " (personalizada)"}
              </option>
            ))}
          </SelectField>
          {user?.role === "superadmin" && (
            <button
              type="button"
              className={styles.newCategoryButton}
              onClick={() => setCreatingCategory(true)}
            >
              <FiPlus aria-hidden="true" />
              Nova categoria
            </button>
          )}
          {(() => {
            const selected = categories.find(
              (category) => category.id === game.categoryId
            );
            const canDelete =
              selected &&
              (user?.role === "superadmin" ||
                (!selected.isDefault && selected.createdByMe));
            return canDelete ? (
              <button
                type="button"
                className={styles.deleteCategoryButton}
                aria-label={`Excluir categoria ${selected.name}`}
                title={`Excluir categoria ${selected.name}`}
                onClick={() => setPendingCategoryDelete(selected)}
              >
                <FiTrash2 aria-hidden="true" />
              </button>
            ) : null;
          })()}
        </div>
        {creatingCategory && (
          <form
            className={styles.newCategoryForm}
            onSubmit={(event) => {
              event.preventDefault();
              void createNewCategory();
            }}
          >
            <input
              autoFocus
              type="text"
              maxLength={80}
              value={newCategoryName}
              placeholder="Nome da nova categoria"
              aria-label="Nome da nova categoria"
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <button
              type="submit"
              disabled={categorySaving || newCategoryName.trim().length < 2}
            >
              <FiPlus aria-hidden="true" />
              Criar
            </button>
            <button
              type="button"
              className={styles.cancelCategoryButton}
              aria-label="Cancelar nova categoria"
              title="Cancelar"
              onClick={() => {
                setCreatingCategory(false);
                setNewCategoryName("");
              }}
            >
              <FiX aria-hidden="true" />
            </button>
          </form>
        )}
        <div className={styles.folderSelector}>
          <FiFolder aria-hidden="true" />
          <label htmlFor="play-folder">Pasta</label>
          <SelectField
            id="play-folder"
            containerClassName={styles.folderSelect}
            value={game.folderId || ""}
            disabled={foldersLoading || folderSaving}
            onChange={(event) =>
              setGame((current) => ({
                ...current,
                folderId: event.target.value || null,
              }))
            }
          >
            <option value="">
              {foldersLoading ? "Carregando..." : "Sem pasta"}
            </option>
            {folders.map((folder) => (
              <option value={folder.id} key={folder.id}>
                {folder.name}
              </option>
            ))}
          </SelectField>
          <button
            type="button"
            className={styles.newCategoryButton}
            onClick={() => setFolderDialogOpen(true)}
          >
            <FiFolderPlus aria-hidden="true" />
            Nova pasta
          </button>
        </div>
        <fieldset className={styles.visibilitySelector}>
          <legend>Visibilidade</legend>
          <label>
            <input
              type="radio"
              name="play-visibility"
              checked={!game.isPublic}
              onChange={() =>
                setGame((current) => ({ ...current, isPublic: false }))
              }
            />
            <FiLock aria-hidden="true" />
            Privado
          </label>
          <label>
            <input
              type="radio"
              name="play-visibility"
              checked={game.isPublic}
              onChange={() =>
                setGame((current) => ({ ...current, isPublic: true }))
              }
            />
            <FiGlobe aria-hidden="true" />
            Público
          </label>
        </fieldset>
      </section>

      <section className={styles.importBar} aria-label="Importação de Play!">
        <div className={styles.importDescription}>
          <span className={styles.importIcon} aria-hidden="true">
            <FiFileText />
          </span>
          <div>
            <strong>Importe um Play! pronto</strong>
            <small>
              Preencha o modelo CSV no Excel ou Google Planilhas e envie aqui.
            </small>
          </div>
        </div>
        <div className={styles.importActions}>
          <a
            href="/modelo-importacao-play.csv"
            download
            className={styles.modelButton}
          >
            <FiDownload aria-hidden="true" />
            Baixar modelo
          </a>
          <button
            type="button"
            className={styles.aiButton}
            onClick={() => {
              setAiError("");
              setAiModalOpen(true);
            }}
          >
            <FiCpu aria-hidden="true" />
            Gerar com IA
          </button>
          <label className={styles.importButton}>
            <FiUploadCloud aria-hidden="true" />
            Importar CSV
            <input
              data-testid="play-csv-input"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                void importCsv(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </section>

      <GameContext.Provider
        value={{
          game,
          setGame,
          questionNumber,
          setQuestionNumber,
          formErrors,
          validateForm,
          validateFormAndIgnoreError,
          defaultPlayTime,
        }}
      >
        <div className={styles.layout}>
          <Questions />
          <Editor />
          <Options />
        </div>
      </GameContext.Provider>

      <NoticeModal
        open={pendingCategoryDelete !== null}
        title="Excluir categoria?"
        messages={[
          pendingCategoryDelete?.isDefault
            ? "Os Plays! padrão desta categoria serão excluídos. Outros Plays! serão movidos para uma categoria disponível."
            : "Os Plays! desta categoria serão movidos para uma categoria disponível.",
        ]}
        tone="warning"
        closeLabel="Cancelar"
        actionLabel="Excluir categoria"
        actionTone="danger"
        onClose={() => setPendingCategoryDelete(null)}
        onAction={() => void deletePendingCategory()}
      />
      <FolderModal
        open={folderDialogOpen}
        title="Criar pasta"
        pending={folderSaving}
        onClose={() => setFolderDialogOpen(false)}
        onSubmit={(name) => void createNewFolder(name)}
      />
      <NoticeModal
        open={notice !== null}
        title={notice?.title ?? ""}
        messages={notice?.messages ?? []}
        tone={notice?.tone}
        onClose={() => setNotice(null)}
      />
      <AiPlayModal
        open={aiModalOpen}
        generating={aiGenerating}
        error={aiError}
        categories={categories}
        initialCategoryId={game.categoryId}
        onClose={() => {
          if (!aiGenerating) setAiModalOpen(false);
        }}
        onGenerate={(prompt, categoryId) =>
          void generateWithAi(prompt, categoryId)
        }
      />
    </main>
  );
}

export default Create;

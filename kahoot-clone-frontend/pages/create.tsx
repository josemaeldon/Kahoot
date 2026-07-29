import React, { useEffect, useState } from "react";
import styles from "../styles/create.module.css";
import Questions from "../Components/Questions";
import Image from "next/image";
import Editor from "../Components/Editor";
import Options from "../Components/Options";
import type { db } from "../kahoot";
import useUser from "@lib/useSSRUser";
import { useRouter } from "next/router";
import { postData } from "@lib/postData";
import { APIResponse, APIRequest } from "./api/create";
import NoticeModal from "../Components/NoticeModal";
import {
  APIResponse as GetGameRes,
  APIRequest as GetGameReq,
} from "./api/getOneGame";
import { FiArrowLeft, FiSave } from "react-icons/fi";

interface Notice {
  title: string;
  messages: string[];
  tone: "warning" | "error";
}

export interface QuestionError {
  correctChoiceError: boolean;
  questionBlankError: boolean;
  choicesRequiredError: boolean;
  ignoreErrors: boolean;
}

interface FormErrorReport {
  titleBlankError: boolean;
  questionErrors: QuestionError[];
}

interface GameContextValue {
  game: db.KahootGame;
  setGame: React.Dispatch<React.SetStateAction<db.KahootGame>>;
  questionNumber: number;
  setQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
  formErrors: FormErrorReport | null;
  validateForm: (game: db.KahootGame) => void;
  validateFormAndIgnoreError: (
    game: db.KahootGame,
    questionIndex: number
  ) => void;
}

const defaultGame: db.KahootGame = {
  _id: "",
  author_id: "",
  author_username: "",
  title: "",
  date: 0,
  questions: [
    {
      correctAnswer: 0,
      choices: ["", "", "", ""],
      question: "",
      image: null,
      time: 30,
    },
  ],
};

export const GameContext = React.createContext<GameContextValue>(null);

function getFormErrors(game: db.KahootGame): FormErrorReport {
  return {
    titleBlankError: game.title.trim() === "",
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
    messages.push("Informe um título para o quiz.");
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
  const [game, setGame] = useState<db.KahootGame>(defaultGame);
  const [formErrors, setFormErrors] = useState<FormErrorReport | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { loggedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loggedIn || !router.isReady || !router.query.editingId) return;

    postData<GetGameReq, GetGameRes>("/api/getOneGame", {
      gameId: router.query.editingId as string,
    })
      .then((response) => {
        if (!("game" in response)) {
          setNotice({
            title: "Não foi possível carregar o quiz",
            messages: [response.errorDescription],
            tone: "error",
          });
          return;
        }
        setGame(response.game);
      })
      .catch(() =>
        setNotice({
          title: "Não foi possível carregar o quiz",
          messages: ["Verifique sua conexão e tente novamente em instantes."],
          tone: "error",
        })
      );
  }, [loggedIn, router.isReady, router.query.editingId]);

  if (!loggedIn) return null;

  function validateForm(gameToValidate: db.KahootGame) {
    setFormErrors(getFormErrors(gameToValidate));
  }

  function validateFormAndIgnoreError(
    gameToValidate: db.KahootGame,
    questionIndex: number
  ) {
    const nextErrors = getFormErrors(gameToValidate);
    nextErrors.questionErrors[questionIndex].ignoreErrors = true;
    setFormErrors(nextErrors);
  }

  async function saveGame() {
    const nextErrors = getFormErrors(game);
    setFormErrors(nextErrors);
    const validationMessages = getValidationMessages(nextErrors);

    if (validationMessages.length > 0) {
      setNotice({
        title: "Revise o quiz",
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
      await router.push("/profile");
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
            src="/kahootLogo.svg"
            width={124}
            height={43}
            alt="Kahoot!"
            priority
          />
        </button>
        <input
          className={`${styles.titleInput} ${
            formErrors?.titleBlankError ? styles.invalid : ""
          }`}
          type="text"
          placeholder="Digite o título do Kahoot..."
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

      <GameContext.Provider
        value={{
          game,
          setGame,
          questionNumber,
          setQuestionNumber,
          formErrors,
          validateForm,
          validateFormAndIgnoreError,
        }}
      >
        <div className={styles.layout}>
          <Questions />
          <Editor />
          <Options />
        </div>
      </GameContext.Provider>

      <NoticeModal
        open={notice !== null}
        title={notice?.title ?? ""}
        messages={notice?.messages ?? []}
        tone={notice?.tone}
        onClose={() => setNotice(null)}
      />
    </main>
  );
}

export default Create;

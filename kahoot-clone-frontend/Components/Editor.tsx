import React, { useContext, useState } from "react";
import { GameContext } from "../pages/create";
import styles from "../styles/Editor.module.css";
import {
  BsFillCircleFill,
  BsFillSquareFill,
  BsFillTriangleFill,
} from "react-icons/bs";
import { FaCheck } from "react-icons/fa";
import { FiImage, FiTrash2, FiUploadCloud } from "react-icons/fi";
import NoticeModal from "./NoticeModal";

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function prepareQuestionImage(file: File) {
  if (!supportedImageTypes.has(file.type)) {
    throw new Error("Use uma imagem JPG, PNG ou WebP.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("A imagem original deve ter no máximo 8 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      element.src = objectUrl;
    });
    const maxDimension = 960;
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível processar a imagem.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.76);
    if (dataUrl.length > 750000) {
      throw new Error(
        "A imagem continuou muito grande após a compactação. Escolha outra."
      );
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const answerLabels = [
  "Resposta 1",
  "Resposta 2",
  "Resposta 3 (opcional)",
  "Resposta 4 (opcional)",
];

const answerStyles = [
  styles.red,
  styles.blue,
  styles.yellow,
  styles.green,
];

function AnswerShape({ index }: { index: number }) {
  if (index === 0) return <BsFillTriangleFill aria-hidden="true" />;
  if (index === 1)
    return <BsFillSquareFill className={styles.diamond} aria-hidden="true" />;
  if (index === 2) return <BsFillCircleFill aria-hidden="true" />;
  return <BsFillSquareFill aria-hidden="true" />;
}

function Editor() {
  const { game, setGame, questionNumber, formErrors, validateForm } =
    useContext(GameContext);
  const question = game.questions[questionNumber];
  const questionError = formErrors?.questionErrors[questionNumber];
  const [imageError, setImageError] = useState("");
  const [processingImage, setProcessingImage] = useState(false);

  function updateQuestionText(value: string) {
    const nextGame = {
      ...game,
      questions: game.questions.map((item, index) =>
        index === questionNumber ? { ...item, question: value } : item
      ),
    };
    setGame(nextGame);
    if (questionError?.questionBlankError) validateForm(nextGame);
  }

  function updateChoice(answerIndex: number, value: string) {
    const nextGame = {
      ...game,
      questions: game.questions.map((item, index) =>
        index === questionNumber
          ? {
              ...item,
              choices: item.choices.map((choice, choiceIndex) =>
                choiceIndex === answerIndex ? value : choice
              ),
            }
          : item
      ),
    };
    setGame(nextGame);
    if (
      questionError?.choicesRequiredError ||
      questionError?.correctChoiceError
    ) {
      validateForm(nextGame);
    }
  }

  function setCorrectAnswer(answerIndex: number) {
    const nextGame = {
      ...game,
      questions: game.questions.map((item, index) =>
        index === questionNumber
          ? { ...item, correctAnswer: answerIndex }
          : item
      ),
    };
    setGame(nextGame);
    if (questionError?.correctChoiceError) validateForm(nextGame);
  }

  function updateQuestionImage(image: string | null) {
    setGame((current) => ({
      ...current,
      questions: current.questions.map((item, index) =>
        index === questionNumber ? { ...item, image } : item
      ),
    }));
  }

  async function selectImage(file: File | undefined) {
    if (!file) return;
    setProcessingImage(true);
    setImageError("");
    try {
      updateQuestionImage(await prepareQuestionImage(file));
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Não foi possível usar a imagem."
      );
    } finally {
      setProcessingImage(false);
    }
  }

  return (
    <section className={styles.container} aria-label="Editor da pergunta">
      <div className={styles.canvas}>
        <label className={styles.questionField}>
          <span>Questão</span>
          <textarea
            data-placeholder="Questão..."
            placeholder="Questão..."
            value={question.question}
            maxLength={120}
            className={
              questionError?.questionBlankError &&
              !questionError.ignoreErrors
                ? styles.invalid
                : ""
            }
            onChange={(event) => updateQuestionText(event.target.value)}
          />
          <small>{question.question.length} / 120</small>
        </label>

        <section className={styles.imageSection} aria-label="Imagem da pergunta">
          <div className={styles.imageSectionHeading}>
            <div>
              <FiImage aria-hidden="true" />
              <span>Imagem da questão</span>
              <small>Opcional</small>
            </div>
            <label className={styles.imageUploadButton}>
              <FiUploadCloud aria-hidden="true" />
              {processingImage
                ? "Processando..."
                : question.image
                  ? "Trocar imagem"
                  : "Adicionar imagem"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={processingImage}
                onChange={(event) => {
                  void selectImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          {question.image ? (
            <div className={styles.imagePreview}>
              <img src={question.image} alt="Prévia da imagem da questão" />
              <button
                type="button"
                aria-label="Remover imagem da questão"
                onClick={() => updateQuestionImage(null)}
              >
                <FiTrash2 aria-hidden="true" />
                Remover
              </button>
            </div>
          ) : (
            <p className={styles.imageHint}>
              A imagem aparecerá abaixo do título durante a partida.
            </p>
          )}
        </section>

        <div className={styles.answersHeading}>
          <h2>Respostas</h2>
          <p>Marque a alternativa correta.</p>
        </div>

        <div className={styles.grid}>
          {question.choices.map((choice, index) => {
            const requiredChoiceMissing =
              index < 2 &&
              questionError?.choicesRequiredError &&
              !questionError.ignoreErrors &&
              choice.trim() === "";
            const isCorrect = question.correctAnswer === index;

            return (
              <article
                className={`${styles.answerCard} ${answerStyles[index]} ${
                  requiredChoiceMissing ? styles.invalid : ""
                }`}
                key={index}
              >
                <div className={styles.shape}>
                  <AnswerShape index={index} />
                </div>
                <div className={styles.answerField}>
                  <label htmlFor={`answer-${index}`}>
                    {answerLabels[index]}
                  </label>
                  <textarea
                    id={`answer-${index}`}
                    data-placeholder={answerLabels[index]}
                    placeholder={
                      index < 2 ? `Digite a resposta ${index + 1}` : "Opcional"
                    }
                    value={choice}
                    maxLength={120}
                    onChange={(event) => updateChoice(index, event.target.value)}
                  />
                  <small>{choice.length} / 120</small>
                </div>
                <button
                  type="button"
                  className={`${styles.correctButton} ${
                    isCorrect ? styles.correctButtonSelected : ""
                  }`}
                  aria-label={`Marcar ${answerLabels[index]} como correta`}
                  aria-pressed={isCorrect}
                  onClick={() => setCorrectAnswer(index)}
                >
                  {isCorrect && <FaCheck aria-hidden="true" />}
                </button>
              </article>
            );
          })}
        </div>
      </div>
      <NoticeModal
        open={imageError !== ""}
        title="Não foi possível adicionar a imagem"
        messages={imageError ? [imageError] : []}
        tone="error"
        onClose={() => setImageError("")}
      />
    </section>
  );
}

export default Editor;

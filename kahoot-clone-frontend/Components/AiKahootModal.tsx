import { FormEvent, useEffect, useRef, useState } from "react";
import { FiCpu, FiTag, FiX } from "react-icons/fi";
import styles from "@styles/AiKahootModal.module.css";
import SelectField from "@components/SelectField";
import type { db } from "kahoot";

interface AiKahootModalProps {
  open: boolean;
  generating: boolean;
  error: string;
  categories: db.KahootCategory[];
  initialCategoryId: string;
  onClose: () => void;
  onGenerate: (prompt: string, categoryId: string) => void;
}

export default function AiKahootModal({
  open,
  generating,
  error,
  categories,
  initialCategoryId,
  onClose,
  onGenerate,
}: AiKahootModalProps) {
  const [prompt, setPrompt] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setCategoryId(initialCategoryId);
    const previousFocus = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !generating) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    textareaRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [generating, initialCategoryId, open]);

  if (!open) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = prompt.trim();
    if (normalized.length >= 10 && categoryId && !generating) {
      onGenerate(normalized, categoryId);
    }
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !generating) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-kahoot-title"
        className={styles.modal}
      >
        <header className={styles.header}>
          <span className={styles.icon} aria-hidden="true">
            <FiCpu />
          </span>
          <div>
            <span className={styles.eyebrow}>Assistente de criação</span>
            <h2 id="ai-kahoot-title">Gerar Kahoot com IA</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Fechar gerador com IA"
            title="Fechar"
            disabled={generating}
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={submit}>
          <label className={styles.categoryField}>
            <span>
              <FiTag aria-hidden="true" />
              Categoria do Kahoot
            </span>
            <SelectField
              value={categoryId}
              disabled={generating}
              aria-label="Categoria do Kahoot gerado por IA"
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isDefault ? "" : " (personalizada)"}
                </option>
              ))}
            </SelectField>
          </label>

          <label className={styles.promptField}>
            <span>O que você quer ensinar?</span>
            <textarea
              ref={textareaRef}
              value={prompt}
              minLength={10}
              maxLength={2000}
              disabled={generating}
              placeholder="Ex.: Crie um Kahoot de nível intermediário sobre o sistema solar para alunos do 7º ano."
              onChange={(event) => setPrompt(event.target.value)}
            />
            <small>{prompt.length} / 2.000</small>
          </label>

          <div className={styles.outputSummary}>
            <strong>10 perguntas</strong>
            <span>4 respostas por pergunta</span>
            <span>1 resposta correta</span>
          </div>

          <p className={styles.replaceNotice}>
            O conteúdo atual do editor será substituído. Revise as perguntas
            geradas antes de salvar.
          </p>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              disabled={generating}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.generateButton}
              disabled={
                generating || prompt.trim().length < 10 || !categoryId
              }
            >
              {generating ? (
                <>
                  <span className="appSpinner" aria-hidden="true" />
                  Gerando...
                </>
              ) : (
                <>
                  <FiCpu aria-hidden="true" />
                  Gerar Kahoot
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { FiFolderPlus, FiTag } from "react-icons/fi";
import styles from "@styles/FolderModal.module.css";

interface FolderModalProps {
  open: boolean;
  title: string;
  initialName?: string;
  pending?: boolean;
  kind?: "folder" | "category";
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function FolderModal({
  open,
  title,
  initialName = "",
  pending = false,
  kind = "folder",
  onClose,
  onSubmit,
}: FolderModalProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(pending);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  pendingRef.current = pending;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [initialName, open]);

  if (!open) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) onSubmit(trimmedName);
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className={styles.icon} aria-hidden="true">
          {kind === "category" ? <FiTag /> : <FiFolderPlus />}
        </div>
        <div className={styles.content}>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>
            {kind === "category"
              ? "Use um nome claro para agrupar Kahoots do mesmo assunto."
              : "Use um tema fácil de reconhecer para encontrar seus Kahoots."}
          </p>
          <form onSubmit={submit}>
            <label htmlFor={`${titleId}-name`}>
              Nome da {kind === "category" ? "categoria" : "pasta"}
            </label>
            <input
              ref={inputRef}
              id={`${titleId}-name`}
              value={name}
              maxLength={80}
              placeholder={
                kind === "category"
                  ? "Ex.: História, Ciências, Catequese"
                  : "Ex.: Turma 7º ano"
              }
              onChange={(event) => setName(event.target.value)}
              required
            />
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelButton}
                disabled={pending}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={pending || name.trim() === ""}
              >
                {pending
                  ? "Salvando..."
                  : `Salvar ${kind === "category" ? "categoria" : "pasta"}`}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

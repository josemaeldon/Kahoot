import { useEffect, useRef } from "react";
import styles from "../styles/NoticeModal.module.css";

type NoticeTone = "warning" | "error" | "info";

interface NoticeModalProps {
  open: boolean;
  title: string;
  messages: string[];
  tone?: NoticeTone;
  closeLabel?: string;
  actionLabel?: string;
  actionTone?: "primary" | "danger";
  onAction?: () => void;
  onClose: () => void;
}

export default function NoticeModal({
  open,
  title,
  messages,
  tone = "warning",
  closeLabel = "Entendi",
  actionLabel,
  actionTone = "primary",
  onAction,
  onClose,
}: NoticeModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        if (!actionButtonRef.current) {
          closeButtonRef.current?.focus();
          return;
        }
        const movingBackwards = event.shiftKey;
        const focusIsOnClose = document.activeElement === closeButtonRef.current;
        if (movingBackwards || !focusIsOnClose) {
          closeButtonRef.current.focus();
        } else {
          actionButtonRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notice-modal-title"
        aria-describedby="notice-modal-description"
        className={`${styles.modal} ${styles[tone]}`}
      >
        <div className={styles.icon} aria-hidden="true">
          !
        </div>
        <div className={styles.content}>
          <h2 id="notice-modal-title" className={styles.title}>
            {title}
          </h2>
          <div id="notice-modal-description" className={styles.description}>
            {messages.length === 1 ? (
              <p>{messages[0]}</p>
            ) : (
              <ul>
                {messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.actions}>
            <button
              ref={closeButtonRef}
              type="button"
              className={actionLabel ? styles.cancelButton : styles.closeButton}
              onClick={onClose}
            >
              {closeLabel}
            </button>
            {actionLabel && onAction && (
              <button
                ref={actionButtonRef}
                type="button"
                className={
                  actionTone === "danger"
                    ? styles.dangerButton
                    : styles.actionButton
                }
                onClick={onAction}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

import { FormEvent, useEffect, useRef, useState } from "react";
import type { auth } from "kahoot";
import { FiLock, FiPhone, FiUser, FiX } from "react-icons/fi";
import { postData } from "@lib/postData";
import type {
  APIRequest,
  APIResponse,
} from "../pages/api/account";
import styles from "../styles/AccountModal.module.css";

interface AccountModalProps {
  open: boolean;
  user: auth.accessTokenPayload;
  onClose: () => void;
  onUpdated: (user: auth.accessTokenPayload) => void;
}

export default function AccountModal({
  open,
  user,
  onClose,
  onUpdated,
}: AccountModalProps) {
  const [username, setUsername] = useState(user.username);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setUsername(user.username);
    setWhatsapp(user.whatsapp);
    setCurrentPassword("");
    setNewPassword("");
    setError("");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    usernameRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingRef.current) onClose();
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled)'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, open, user.username, user.whatsapp]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    savingRef.current = true;
    try {
      const response = await postData<APIRequest, APIResponse>("/api/account", {
        username,
        whatsapp,
        currentPassword,
        newPassword: newPassword || undefined,
      });
      if (!("user" in response)) {
        setError(response.errorDescription);
        return;
      }
      onUpdated(response.user);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
      >
        <header className={styles.heading}>
          <div>
            <span>Minha conta</span>
            <h2 id="account-modal-title">Editar dados do usuário</h2>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            disabled={saving}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={(event) => void submit(event)}>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <label className={styles.field}>
            <span>Usuário</span>
            <div className={styles.inputShell}>
              <FiUser aria-hidden="true" />
              <input
                ref={usernameRef}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                maxLength={40}
                required
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>WhatsApp</span>
            <div className={styles.inputShell}>
              <FiPhone aria-hidden="true" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(91) 99999-9999"
                required
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>Senha atual</span>
            <div className={styles.inputShell}>
              <FiLock aria-hidden="true" />
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Confirme para salvar"
                required
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>Nova senha</span>
            <div className={styles.inputShell}>
              <FiLock aria-hidden="true" />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Deixe em branco para manter"
              />
            </div>
          </label>
          <p className={styles.hint}>
            A nova senha deve ter pelo menos 8 caracteres.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

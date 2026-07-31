import { FormEvent, useEffect, useRef, useState } from "react";
import type { auth } from "play";
import { FiClock, FiCreditCard, FiLock, FiMail, FiPhone, FiUser, FiX } from "react-icons/fi";
import { postData } from "@lib/postData";
import type {
  APIRequest,
  APIResponse,
} from "../pages/api/account";
import styles from "../styles/AccountModal.module.css";
import { getAccessPeriodSummary } from "@lib/accessPeriod";
import { maskCpfOrCnpj, maskPhone } from "@lib/masks";

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
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [cpf, setCpf] = useState(() => maskCpfOrCnpj(user.cpf));
  const [username, setUsername] = useState(user.username);
  const [whatsapp, setWhatsapp] = useState(() => maskPhone(user.whatsapp));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const accessPeriod = getAccessPeriodSummary(user);

  useEffect(() => {
    if (!open) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setCpf(maskCpfOrCnpj(user.cpf));
    setUsername(user.username);
    setWhatsapp(maskPhone(user.whatsapp));
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
  }, [onClose, open, user.cpf, user.email, user.fullName, user.username, user.whatsapp]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    savingRef.current = true;
    try {
      const response = await postData<APIRequest, APIResponse>("/api/account", {
        fullName,
        email,
        cpf,
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

        <div
          className={`${styles.accessCard} ${
            styles[`accessCard_${accessPeriod.state}`]
          }`}
        >
          <span className={styles.accessIcon} aria-hidden="true">
            <FiClock />
          </span>
          <div>
            <strong>{accessPeriod.label}</strong>
            <p>{accessPeriod.detail}</p>
          </div>
        </div>

        <form onSubmit={(event) => void submit(event)}>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <label className={styles.field}>
            <span>Nome completo</span>
            <div className={styles.inputShell}>
              <FiUser aria-hidden="true" />
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={160} required />
            </div>
          </label>

          <label className={styles.field}>
            <span>E-mail</span>
            <div className={styles.inputShell}>
              <FiMail aria-hidden="true" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value.trimStart())} autoComplete="email" maxLength={254} required />
            </div>
          </label>

          <label className={styles.field}>
            <span>CPF ou CNPJ</span>
            <div className={styles.inputShell}>
              <FiCreditCard aria-hidden="true" />
              <input value={cpf} onChange={(event) => setCpf(maskCpfOrCnpj(event.target.value))} inputMode="numeric" maxLength={18} required />
            </div>
          </label>

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
                onChange={(event) => setWhatsapp(maskPhone(event.target.value))}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(91) 99999-9999"
                required
                maxLength={15}
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
                minLength={8}
                maxLength={128}
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

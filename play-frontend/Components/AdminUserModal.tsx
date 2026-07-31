import { FormEvent, useEffect, useRef, useState } from "react";
import type { auth } from "play";
import type { AccessOption, ManagedUser } from "../pages/api/admin/users";
import type { SubscriptionPlan } from "../pages/api/admin/plans";
import { getAccessPeriodSummary } from "@lib/accessPeriod";
import {
  FiCreditCard,
  FiClock,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";
import { maskCpfOrCnpj, maskPhone } from "@lib/masks";
import styles from "../styles/admin.module.css";

export interface AdminUserFormValues {
  fullName: string;
  email: string;
  cpf: string;
  username: string;
  whatsapp: string;
  password: string;
  role: auth.UserRole;
  access: AccessOption | "keep";
  planId: string;
}

interface AdminUserModalProps {
  user: ManagedUser | null;
  saving: boolean;
  error: string;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSubmit: (values: AdminUserFormValues) => void;
}

const accessChoices: Array<[AccessOption | "keep", string]> = [
  ["keep", "Manter período atual"],
  ["30", "30 dias"],
  ["60", "60 dias"],
  ["90", "90 dias"],
  ["unlimited", "Tempo indeterminado"],
  ["disabled", "Desativar acesso"],
];

export default function AdminUserModal({
  user,
  saving,
  error,
  plans,
  onClose,
  onSubmit,
}: AdminUserModalProps) {
  const isEditing = Boolean(user);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<auth.UserRole>("user");
  const [access, setAccess] = useState<AccessOption | "keep">("30");
  const [planId, setPlanId] = useState("");
  const modalRef = useRef<HTMLElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(user?.fullName || "");
    setEmail(user?.email || "");
    setCpf(maskCpfOrCnpj(user?.cpf || ""));
    setUsername(user?.username || "");
    setWhatsapp(maskPhone(user?.whatsapp || ""));
    setPassword("");
    setRole(user?.role || "user");
    setAccess(user ? "keep" : "30");
    setPlanId(user?.assignedPlanId || "");
    usernameRef.current?.focus();
  }, [user]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled)"
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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ fullName, email, cpf, username, whatsapp, password, role, access, planId });
  }

  const currentAccess = user ? getAccessPeriodSummary(user) : null;

  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        ref={modalRef}
        className={styles.userModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <button
          type="button"
          className={styles.modalClose}
          aria-label="Fechar"
          onClick={onClose}
          disabled={saving}
        >
          <FiX aria-hidden="true" />
        </button>
        <span className={styles.cardLabel}>
          {isEditing ? "Editar conta" : "Nova conta"}
        </span>
        <h2 id="user-modal-title">
          {isEditing ? user?.username : "Adicionar usuário"}
        </h2>
        <p>
          {isEditing
            ? "Atualize os dados, a permissão e o período de uso."
            : "Crie o acesso e defina como este usuário poderá usar o sistema."}
        </p>

        {currentAccess && (
          <div className={styles.currentAccess}>
            <FiClock aria-hidden="true" />
            <div>
              <span>Acesso atual</span>
              <strong>{currentAccess.label}</strong>
            </div>
          </div>
        )}

        <form onSubmit={submit}>
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}

          <label className={styles.field}>
            <span>Nome completo</span>
            <div className={styles.inputShell}><FiUser aria-hidden="true" /><input ref={usernameRef} value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={160} autoComplete="off" placeholder="Nome e sobrenome" required /></div>
          </label>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>E-mail</span>
              <div className={styles.inputShell}><FiMail aria-hidden="true" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="off" placeholder="usuario@exemplo.com" required /></div>
            </label>
            <label className={styles.field}>
              <span>CPF ou CNPJ</span>
              <div className={styles.inputShell}><FiCreditCard aria-hidden="true" /><input value={cpf} onChange={(event) => setCpf(maskCpfOrCnpj(event.target.value))} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="CPF ou CNPJ" required /></div>
            </label>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Usuário</span>
              <div className={styles.inputShell}>
                <FiUser aria-hidden="true" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  placeholder="Nome de usuário"
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
                  maxLength={15}
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="(91) 99999-9999"
                  required
                />
              </div>
            </label>
          </div>

          <label className={styles.field}>
            <span>{isEditing ? "Nova senha (opcional)" : "Senha inicial"}</span>
            <div className={styles.inputShell}>
              <FiLock aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder={
                  isEditing
                    ? "Deixe em branco para manter"
                    : "Mínimo de 8 caracteres"
                }
                required={!isEditing}
              />
            </div>
          </label>

          <fieldset className={styles.roleFieldset}>
            <legend>Tipo de usuário</legend>
            <div className={styles.roleOptions}>
              <label
                className={`${styles.roleOption} ${
                  role === "user" ? styles.roleOptionSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === "user"}
                  onChange={() => {
                    setRole("user");
                    if (user?.role === "superadmin") setAccess("30");
                  }}
                />
                <FiUser aria-hidden="true" />
                <span>
                  <strong>Usuário</strong>
                  <small>Acesso conforme o período escolhido</small>
                </span>
              </label>
              <label
                className={`${styles.roleOption} ${
                  role === "superadmin" ? styles.roleOptionSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="superadmin"
                  checked={role === "superadmin"}
                  onChange={() => setRole("superadmin")}
                />
                <FiShield aria-hidden="true" />
                <span>
                  <strong>Superadmin</strong>
                  <small>Administração e acesso permanente</small>
                </span>
              </label>
            </div>
          </fieldset>

          {role === "user" && (
            <label className={styles.field}>
              <span>Plano atribuído</span>
              <select
                value={planId}
                onChange={(event) => {
                  const nextPlanId = event.target.value;
                  setPlanId(nextPlanId);
                  if (!nextPlanId && user?.assignedPlanId) setAccess("30");
                }}
              >
                <option value="">Sem plano específico — usar período manual</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {plan.durationDays} dias{plan.isActive ? "" : " · arquivado"}
                  </option>
                ))}
              </select>
              {user?.assignedPlanName && <small>Plano atual: {user.assignedPlanName}</small>}
            </label>
          )}

          {role === "user" && !planId && (
            <fieldset className={styles.accessFieldset}>
              <legend>Período de uso</legend>
              <div className={styles.accessOptions}>
                {accessChoices
                  .filter(([value]) => isEditing || value !== "keep")
                  .map(([value, label]) => (
                    <label
                      key={value}
                      className={`${styles.accessOption} ${
                        access === value ? styles.accessOptionSelected : ""
                      } ${
                        value === "disabled"
                          ? styles.accessOptionDanger
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="access"
                        value={value}
                        checked={access === value}
                        onChange={() => setAccess(value)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
              </div>
            </fieldset>
          )}

          {role === "superadmin" && (
            <div className={styles.adminAccessNote}>
              <FiShield aria-hidden="true" />
              Superadmins possuem acesso permanente e podem administrar todas
              as contas.
            </div>
          )}

          <div className={styles.modalActions}>
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
              {saving
                ? "Salvando..."
                : isEditing
                  ? "Salvar usuário"
                  : "Criar usuário"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

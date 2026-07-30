import AdminUserModal, {
  type AdminUserFormValues,
} from "@components/AdminUserModal";
import Header from "@components/Header";
import NoticeModal from "@components/NoticeModal";
import SelectField from "@components/SelectField";
import { getAccessPeriodSummary } from "@lib/accessPeriod";
import { postData } from "@lib/postData";
import useUser from "@lib/useUser";
import styles from "@styles/admin.module.css";
import type { ManagedUser } from "./api/admin/users";
import type {
  AiSettingsResponse,
  PublicAiSettings,
} from "./api/admin/ai-settings";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiEdit2,
  FiKey,
  FiMessageCircle,
  FiPlus,
  FiSave,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { useCallback, useEffect, useMemo, useState } from "react";

interface AdminData {
  error: false;
  registrationEnabled: boolean;
  users: ManagedUser[];
}

interface ApiError {
  error: true;
  errorDescription: string;
}

type AdminResponse = AdminData | ApiError;

interface AiSettingsDraft {
  enabled: boolean;
  model: string;
  reasoningEffort: PublicAiSettings["reasoningEffort"];
  systemInstructions: string;
  apiKey: string;
  clearApiKey: boolean;
}

function settingsDraft(settings: PublicAiSettings): AiSettingsDraft {
  return {
    enabled: settings.enabled,
    model: settings.model,
    reasoningEffort: settings.reasoningEffort,
    systemInstructions: settings.systemInstructions,
    apiKey: "",
    clearApiKey: false,
  };
}

function userStatus(user: ManagedUser) {
  if (user.role === "superadmin") {
    return { label: "Superadmin", kind: "admin" };
  }
  if (!user.isEnabled) {
    return { label: "Desativado", kind: "disabled" };
  }
  if (
    user.accessExpiresAt &&
    new Date(user.accessExpiresAt).getTime() <= Date.now()
  ) {
    return { label: "Expirado", kind: "expired" };
  }
  if (!user.accessExpiresAt) {
    return { label: "Sem prazo", kind: "active" };
  }
  return { label: "Ativo", kind: "active" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Admin() {
  const { user } = useUser();
  const [data, setData] = useState<AdminData | null>(null);
  const [search, setSearch] = useState("");
  const [modalUser, setModalUser] = useState<
    ManagedUser | null | undefined
  >(undefined);
  const [pendingDelete, setPendingDelete] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiSettings, setAiSettings] = useState<PublicAiSettings | null>(null);
  const [aiDraft, setAiDraft] = useState<AiSettingsDraft | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone: "info" | "error";
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as AdminResponse;
      if ("errorDescription" in payload) {
        setNotice({
          title: "Não foi possível carregar",
          message: payload.errorDescription,
          tone: "error",
        });
        return;
      }
      setData(payload);
    } catch {
      setNotice({
        title: "Não foi possível carregar",
        message: "Verifique sua conexão e tente novamente.",
        tone: "error",
      });
    }
  }, []);

  const loadAiSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/ai-settings", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as AiSettingsResponse;
      if (!("settings" in payload)) throw new Error(payload.errorDescription);
      setAiSettings(payload.settings);
      setAiDraft(settingsDraft(payload.settings));
    } catch (error) {
      setNotice({
        title: "Não foi possível carregar a IA",
        message:
          error instanceof Error
            ? error.message
            : "Verifique sua conexão e tente novamente.",
        tone: "error",
      });
    }
  }, []);

  useEffect(() => {
    if (user?.role === "superadmin") {
      void loadData();
      void loadAiSettings();
    }
  }, [loadAiSettings, loadData, user?.role]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return data?.users || [];
    return (data?.users || []).filter(
      (managedUser) =>
        managedUser.username.toLocaleLowerCase("pt-BR").includes(normalized) ||
        managedUser.whatsapp.includes(normalized)
    );
  }, [data?.users, search]);

  const totals = useMemo(() => {
    const users = data?.users || [];
    return {
      total: users.length,
      active: users.filter((item) => userStatus(item).kind === "active").length,
      attention: users.filter((item) =>
        ["disabled", "expired"].includes(userStatus(item).kind)
      ).length,
    };
  }, [data?.users]);

  function openCreateUser() {
    setFormError("");
    setModalUser(null);
  }

  function openEditUser(managedUser: ManagedUser) {
    setFormError("");
    setModalUser(managedUser);
  }

  async function toggleRegistration() {
    if (!data) return;
    setSaving(true);
    try {
      const response = await postData<
        { type: "setRegistration"; enabled: boolean },
        AdminResponse
      >("/api/admin/users", {
        type: "setRegistration",
        enabled: !data.registrationEnabled,
      });
      if ("errorDescription" in response) {
        throw new Error(response.errorDescription);
      }
      setData(response);
      setNotice({
        title: response.registrationEnabled
          ? "Cadastros ativados"
          : "Cadastros desativados",
        message: response.registrationEnabled
          ? "Novos usuários já podem criar uma conta."
          : "Novas contas não poderão ser criadas até você reativar esta opção.",
        tone: "info",
      });
    } catch (error) {
      setNotice({
        title: "Não foi possível atualizar",
        message:
          error instanceof Error
            ? error.message
            : "Tente novamente em alguns instantes.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveUser(values: AdminUserFormValues) {
    if (modalUser === undefined) return;
    const editing = modalUser !== null;
    setSaving(true);
    setFormError("");
    try {
      const response = await postData<Record<string, unknown>, AdminResponse>(
        "/api/admin/users",
        editing
          ? {
              type: "updateUser",
              userId: modalUser.id,
              ...values,
            }
          : {
              type: "createUser",
              ...values,
            }
      );
      if ("errorDescription" in response) {
        setFormError(response.errorDescription);
        return;
      }
      setData(response);
      setModalUser(undefined);
      setNotice({
        title: editing ? "Usuário atualizado" : "Usuário criado",
        message: editing
          ? `Os dados de ${values.username} foram atualizados.`
          : `${values.username} já pode entrar com a senha definida.`,
        tone: "info",
      });
    } catch {
      setFormError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    setSaving(true);
    try {
      const response = await postData<
        { type: "deleteUser"; userId: string },
        AdminResponse
      >("/api/admin/users", {
        type: "deleteUser",
        userId: target.id,
      });
      if ("errorDescription" in response) {
        throw new Error(response.errorDescription);
      }
      setData(response);
      setNotice({
        title: "Usuário excluído",
        message: `${target.username} e seus quizzes foram removidos do sistema.`,
        tone: "info",
      });
    } catch (error) {
      setNotice({
        title: "Não foi possível excluir",
        message:
          error instanceof Error
            ? error.message
            : "Tente novamente em alguns instantes.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveAiSettings() {
    if (!aiDraft) return;
    setAiSaving(true);
    setAiError("");
    try {
      const response = await postData<
        AiSettingsDraft,
        AiSettingsResponse
      >("/api/admin/ai-settings", aiDraft);
      if (!("settings" in response)) {
        setAiError(response.errorDescription);
        return;
      }
      setAiSettings(response.settings);
      setAiDraft(settingsDraft(response.settings));
      setNotice({
        title: "Configurações de IA salvas",
        message: response.settings.enabled
          ? "A geração de Kahoots com IA está disponível para os usuários."
          : "A geração com IA permanece desativada.",
        tone: "info",
      });
    } catch {
      setAiError("Não foi possível conectar ao servidor.");
    } finally {
      setAiSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.heroIcon} aria-hidden="true">
            <FiShield />
          </div>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Controle do sistema</span>
            <h1>Administração</h1>
            <p>Cadastros, permissões e períodos de acesso em um só lugar.</p>
          </div>
          <button
            type="button"
            className={styles.addUserButton}
            onClick={openCreateUser}
          >
            <FiPlus aria-hidden="true" />
            Adicionar usuário
          </button>
        </div>

        <section className={styles.registrationCard}>
          <div>
            <span className={styles.cardLabel}>Novos usuários</span>
            <h2>Cadastro público</h2>
            <p>
              {data?.registrationEnabled
                ? "Novas contas recebem 30 dias de acesso inicial."
                : "A criação de novas contas está bloqueada."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={data?.registrationEnabled || false}
            className={`${styles.switch} ${
              data?.registrationEnabled ? styles.switchEnabled : ""
            }`}
            onClick={() => void toggleRegistration()}
            disabled={!data || saving}
          >
            <span aria-hidden="true" />
            {data?.registrationEnabled ? "Ativado" : "Desativado"}
          </button>
        </section>

        <section className={styles.aiSection} aria-labelledby="ai-settings-title">
          <div className={styles.aiHeader}>
            <div className={styles.aiTitle}>
              <span className={styles.aiIcon} aria-hidden="true">
                <FiCpu />
              </span>
              <div>
                <span className={styles.cardLabel}>Geração de conteúdo</span>
                <h2 id="ai-settings-title">Inteligência artificial</h2>
                <p>Controle o modelo e as regras usadas no editor de Kahoots.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={aiDraft?.enabled || false}
              className={`${styles.switch} ${
                aiDraft?.enabled ? styles.switchEnabled : ""
              }`}
              disabled={!aiDraft || aiSaving}
              onClick={() =>
                setAiDraft((current) =>
                  current ? { ...current, enabled: !current.enabled } : current
                )
              }
            >
              <span aria-hidden="true" />
              {aiDraft?.enabled ? "Ativada" : "Desativada"}
            </button>
          </div>

          {!aiDraft ? (
            <div className={styles.aiLoading}>
              <span className="appSpinner" />
              Carregando configurações...
            </div>
          ) : (
            <form
              className={styles.aiForm}
              onSubmit={(event) => {
                event.preventDefault();
                void saveAiSettings();
              }}
            >
              <div className={styles.aiFormGrid}>
                <label className={styles.aiField}>
                  <span>Modelo da OpenAI</span>
                  <input
                    type="text"
                    value={aiDraft.model}
                    maxLength={80}
                    disabled={aiSaving}
                    onChange={(event) =>
                      setAiDraft((current) =>
                        current
                          ? { ...current, model: event.target.value }
                          : current
                      )
                    }
                  />
                </label>
                <label className={styles.aiField}>
                  <span>Esforço de raciocínio</span>
                  <SelectField
                    value={aiDraft.reasoningEffort}
                    disabled={aiSaving}
                    onChange={(event) =>
                      setAiDraft((current) =>
                        current
                          ? {
                              ...current,
                              reasoningEffort: event.target
                                .value as AiSettingsDraft["reasoningEffort"],
                            }
                          : current
                      )
                    }
                  >
                    <option value="none">Nenhum</option>
                    <option value="low">Baixo</option>
                    <option value="medium">Médio</option>
                    <option value="high">Alto</option>
                  </SelectField>
                </label>
              </div>

              <label className={styles.aiField}>
                <span>Chave da API da OpenAI</span>
                <div className={styles.aiKeyInput}>
                  <FiKey aria-hidden="true" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={aiDraft.apiKey}
                    minLength={20}
                    disabled={aiSaving || aiDraft.clearApiKey}
                    placeholder={
                      aiSettings?.apiKeyConfigured
                        ? "Chave configurada. Digite para substituir."
                        : "Cole a chave da API"
                    }
                    onChange={(event) =>
                      setAiDraft((current) =>
                        current
                          ? { ...current, apiKey: event.target.value }
                          : current
                      )
                    }
                  />
                </div>
              </label>

              {aiSettings?.apiKeyConfigured && (
                <label className={styles.clearKey}>
                  <input
                    type="checkbox"
                    checked={aiDraft.clearApiKey}
                    disabled={aiSaving}
                    onChange={(event) =>
                      setAiDraft((current) =>
                        current
                          ? {
                              ...current,
                              clearApiKey: event.target.checked,
                              apiKey: "",
                              enabled: event.target.checked
                                ? false
                                : current.enabled,
                            }
                          : current
                      )
                    }
                  />
                  Remover a chave armazenada
                </label>
              )}

              <label className={styles.aiField}>
                <span>Instruções adicionais</span>
                <textarea
                  value={aiDraft.systemInstructions}
                  maxLength={2000}
                  disabled={aiSaving}
                  onChange={(event) =>
                    setAiDraft((current) =>
                      current
                        ? {
                            ...current,
                            systemInstructions: event.target.value,
                          }
                        : current
                    )
                  }
                />
                <small>{aiDraft.systemInstructions.length} / 2.000</small>
              </label>

              {aiError && (
                <p className={styles.aiError} role="alert">
                  {aiError}
                </p>
              )}

              <div className={styles.aiFooter}>
                <p>
                  A chave é criptografada no banco e nunca é exibida novamente.
                </p>
                <button
                  type="submit"
                  className={styles.aiSaveButton}
                  disabled={aiSaving}
                >
                  <FiSave aria-hidden="true" />
                  {aiSaving ? "Salvando..." : "Salvar IA"}
                </button>
              </div>
            </form>
          )}
        </section>

        <div className={styles.stats}>
          <article>
            <FiUsers aria-hidden="true" />
            <div>
              <strong>{totals.total}</strong>
              <span>contas cadastradas</span>
            </div>
          </article>
          <article>
            <FiCheckCircle aria-hidden="true" />
            <div>
              <strong>{totals.active}</strong>
              <span>usuários com acesso</span>
            </div>
          </article>
          <article>
            <FiClock aria-hidden="true" />
            <div>
              <strong>{totals.attention}</strong>
              <span>requerem atenção</span>
            </div>
          </article>
        </div>

        <section className={styles.usersSection}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.cardLabel}>Contas</span>
              <h2>Usuários do sistema</h2>
            </div>
            <label className={styles.search}>
              <FiSearch aria-hidden="true" />
              <span className={styles.srOnly}>Buscar usuário</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou WhatsApp"
              />
            </label>
          </div>

          {!data && (
            <div className={styles.loading}>
              <span className="appSpinner" />
              <p>Carregando usuários...</p>
            </div>
          )}

          {data && filteredUsers.length === 0 && (
            <div className={styles.empty}>Nenhum usuário encontrado.</div>
          )}

          {data && filteredUsers.length > 0 && (
            <div className={styles.userList}>
              {filteredUsers.map((managedUser) => {
                const status = userStatus(managedUser);
                const accessPeriod = getAccessPeriodSummary(managedUser);
                const isCurrentUser = managedUser.id === user?._id;
                return (
                  <article className={styles.userRow} key={managedUser.id}>
                    <div className={styles.userAvatar} aria-hidden="true">
                      {managedUser.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className={styles.userIdentity}>
                      <div className={styles.userNameLine}>
                        <h3>{managedUser.username}</h3>
                        <span
                          className={`${styles.status} ${
                            styles[`status_${status.kind}`]
                          }`}
                        >
                          {status.label}
                        </span>
                        {isCurrentUser && (
                          <span className={styles.currentUserBadge}>
                            Sua conta
                          </span>
                        )}
                      </div>
                      <div className={styles.userMeta}>
                        <a
                          href={`https://wa.me/${managedUser.whatsapp.replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title={`Conversar com ${managedUser.username} no WhatsApp`}
                        >
                          <FiMessageCircle aria-hidden="true" />
                          {managedUser.whatsapp}
                        </a>
                        <span>
                          <FiCalendar aria-hidden="true" />
                          {accessPeriod.label}
                          {managedUser.accessExpiresAt
                            ? ` · até ${formatDate(
                                managedUser.accessExpiresAt
                              )}`
                            : ""}
                        </span>
                      </div>
                    </div>
                    {!isCurrentUser && (
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.manageButton}
                          onClick={() => openEditUser(managedUser)}
                        >
                          <FiEdit2 aria-hidden="true" />
                          Editar
                        </button>
                        <button
                          type="button"
                          className={styles.deleteUserButton}
                          aria-label={`Excluir ${managedUser.username}`}
                          onClick={() => setPendingDelete(managedUser)}
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {modalUser !== undefined && (
        <AdminUserModal
          user={modalUser}
          saving={saving}
          error={formError}
          onClose={() => {
            if (!saving) setModalUser(undefined);
          }}
          onSubmit={(values) => void saveUser(values)}
        />
      )}

      <NoticeModal
        open={pendingDelete !== null}
        title="Excluir usuário?"
        messages={[
          pendingDelete
            ? `${pendingDelete.username}, seus quizzes e todos os dados relacionados serão removidos definitivamente.`
            : "",
        ]}
        tone="warning"
        closeLabel="Cancelar"
        actionLabel="Excluir usuário"
        actionTone="danger"
        onClose={() => setPendingDelete(null)}
        onAction={() => void deleteUser()}
      />

      <NoticeModal
        open={notice !== null}
        title={notice?.title || ""}
        messages={notice ? [notice.message] : []}
        tone={notice?.tone || "info"}
        onClose={() => setNotice(null)}
      />
    </main>
  );
}

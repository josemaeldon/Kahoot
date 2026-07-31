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
import type {
  PublicStripeSettings,
  StripeSettingsResponse,
} from "./api/admin/stripe-settings";
import type { SubscriptionPlan } from "./api/admin/plans";
import type { PublicSmtpSettings, SmtpSettingsResponse } from "./api/admin/smtp-settings";
import type { AdminNotification, AdminNotificationsResponse, NotificationUser } from "./api/admin/notifications";
import { maskCpf, maskCurrency } from "@lib/masks";
import {
  FiCalendar,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiCreditCard,
  FiEdit2,
  FiKey,
  FiMessageCircle,
  FiMail,
  FiPlus,
  FiSave,
  FiSearch,
  FiSend,
  FiSettings,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
} from "react";

type AdminPageSize = 10 | 20 | 100;
type AdminTab = "settings" | "plans" | "notifications" | "users";

interface AdminData {
  error: false;
  registrationEnabled: boolean;
  users: ManagedUser[];
  totals: {
    total: number;
    active: number;
    attention: number;
  };
  pagination: {
    page: number;
    pageSize: AdminPageSize;
    total: number;
    totalPages: number;
  };
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

interface StripeSettingsDraft {
  enabled: boolean;
  secretKey: string;
  webhookSecret: string;
  clearSecretKey: boolean;
  clearWebhookSecret: boolean;
}

interface PlanDraft {
  id: string | null;
  name: string;
  description: string;
  durationDays: 30 | 60 | 90;
  amountCents: number;
}

interface SmtpDraft {
  enabled: boolean; host: string; port: number; secure: boolean; username: string;
  password: string; fromName: string; fromEmail: string; clearPassword: boolean;
}

interface NotificationDraft {
  id: string | null; audience: "all" | "user"; userId: string; title: string; message: string;
}

const emptyPlan: PlanDraft = {
  id: null,
  name: "",
  description: "",
  durationDays: 30,
  amountCents: 0,
};
const emptyNotification: NotificationDraft = { id: null, audience: "all", userId: "", title: "", message: "" };

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
  const [adminTab, setAdminTab] = useState<AdminTab>("settings");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState<AdminPageSize>(10);
  const [modalUser, setModalUser] = useState<
    ManagedUser | null | undefined
  >(undefined);
  const [pendingDelete, setPendingDelete] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiSettings, setAiSettings] = useState<PublicAiSettings | null>(null);
  const [aiDraft, setAiDraft] = useState<AiSettingsDraft | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState("");
  const [stripeSettings, setStripeSettings] = useState<PublicStripeSettings | null>(null);
  const [stripeDraft, setStripeDraft] = useState<StripeSettingsDraft | null>(null);
  const [stripeSaving, setStripeSaving] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlan);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState("");
  const [smtpSettings, setSmtpSettings] = useState<PublicSmtpSettings | null>(null);
  const [smtpDraft, setSmtpDraft] = useState<SmtpDraft | null>(null);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpError, setSmtpError] = useState("");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationUsers, setNotificationUsers] = useState<NotificationUser[]>([]);
  const [notificationDraft, setNotificationDraft] = useState<NotificationDraft>(emptyNotification);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationUserSearch, setNotificationUserSearch] = useState("");
  const deferredNotificationUserSearch = useDeferredValue(notificationUserSearch);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone: "info" | "error";
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: String(userPage),
        pageSize: String(userPageSize),
        search: deferredSearch,
      });
      const response = await fetch(`/api/admin/users?${query}`, {
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
      setUserPage(payload.pagination.page);
    } catch {
      setNotice({
        title: "Não foi possível carregar",
        message: "Verifique sua conexão e tente novamente.",
        tone: "error",
      });
    }
  }, [deferredSearch, userPage, userPageSize]);

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

  const loadStripeSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stripe-settings", { cache: "no-store" });
      const payload = (await response.json()) as StripeSettingsResponse;
      if (!("settings" in payload)) throw new Error(payload.errorDescription);
      setStripeSettings(payload.settings);
      setStripeDraft({ enabled: payload.settings.enabled, secretKey: "", webhookSecret: "", clearSecretKey: false, clearWebhookSecret: false });
    } catch (error) {
      setStripeError(error instanceof Error ? error.message : "Não foi possível carregar a Stripe.");
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const response = await fetch("/api/admin/plans", { cache: "no-store" });
      const payload = await response.json();
      if (payload.error) throw new Error(payload.errorDescription);
      setPlans(payload.plans);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : "Não foi possível carregar os planos.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadSmtpSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/smtp-settings", { cache: "no-store" });
      const payload = (await response.json()) as SmtpSettingsResponse;
      if (!("settings" in payload)) throw new Error(payload.errorDescription);
      setSmtpSettings(payload.settings);
      setSmtpDraft({ ...payload.settings, password: "", clearPassword: false });
    } catch (error) { setSmtpError(error instanceof Error ? error.message : "Não foi possível carregar o SMTP."); }
  }, []);

  const loadNotifications = useCallback(async (search = "") => {
    try {
      const response = await fetch(`/api/admin/notifications?${new URLSearchParams({ search })}`, { cache: "no-store" });
      const payload = (await response.json()) as AdminNotificationsResponse;
      if (!("notifications" in payload)) throw new Error(payload.errorDescription);
      setNotifications(payload.notifications); setNotificationUsers(payload.users);
    } catch (error) { setNotificationError(error instanceof Error ? error.message : "Não foi possível carregar as notificações."); }
  }, []);

  useEffect(() => {
    if (user?.role === "superadmin" && notificationDraft.audience === "user") {
      void loadNotifications(deferredNotificationUserSearch);
    }
  }, [deferredNotificationUserSearch, loadNotifications, notificationDraft.audience, user?.role]);

  useEffect(() => {
    if (user?.role === "superadmin") {
      void loadData();
    }
  }, [loadData, user?.role]);

  useEffect(() => {
    if (user?.role === "superadmin") {
      void loadAiSettings();
      void loadStripeSettings();
      void loadPlans();
      void loadSmtpSettings();
      void loadNotifications();
    }
  }, [loadAiSettings, loadNotifications, loadPlans, loadSmtpSettings, loadStripeSettings, user?.role]);

  function listContext(page = userPage) {
    return {
      page,
      pageSize: userPageSize,
      search: deferredSearch,
    };
  }

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
        Record<string, unknown>,
        AdminResponse
      >("/api/admin/users", {
        type: "setRegistration",
        enabled: !data.registrationEnabled,
        ...listContext(),
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
              ...listContext(),
              ...values,
            }
          : {
              type: "createUser",
              ...listContext(1),
              ...values,
            }
      );
      if ("errorDescription" in response) {
        setFormError(response.errorDescription);
        return;
      }
      setData(response);
      setUserPage(response.pagination.page);
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
        Record<string, unknown>,
        AdminResponse
      >("/api/admin/users", {
        type: "deleteUser",
        userId: target.id,
        ...listContext(),
      });
      if ("errorDescription" in response) {
        throw new Error(response.errorDescription);
      }
      setData(response);
      setUserPage(response.pagination.page);
      setNotice({
        title: "Usuário excluído",
        message: `${target.username} e seus Plays! foram removidos do sistema.`,
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
          ? "A geração de Plays! com IA está disponível para os usuários."
          : "A geração com IA permanece desativada.",
        tone: "info",
      });
    } catch {
      setAiError("Não foi possível conectar ao servidor.");
    } finally {
      setAiSaving(false);
    }
  }

  async function saveStripeSettings() {
    if (!stripeDraft) return;
    setStripeSaving(true);
    setStripeError("");
    try {
      const response = await postData<StripeSettingsDraft, StripeSettingsResponse>("/api/admin/stripe-settings", stripeDraft);
      if (!("settings" in response)) { setStripeError(response.errorDescription); return; }
      setStripeSettings(response.settings);
      setStripeDraft({ enabled: response.settings.enabled, secretKey: "", webhookSecret: "", clearSecretKey: false, clearWebhookSecret: false });
      setNotice({ title: "Stripe configurada", message: response.settings.enabled ? "Pagamentos recorrentes estão ativos." : "A integração permanece desativada.", tone: "info" });
    } catch { setStripeError("Não foi possível conectar ao servidor."); }
    finally { setStripeSaving(false); }
  }

  async function savePlan() {
    setPlanSaving(true);
    setPlanError("");
    try {
      const response = await postData<Record<string, unknown>, { error: false; plans: SubscriptionPlan[] } | ApiError>("/api/admin/plans", { type: "save", ...planDraft });
      if ("errorDescription" in response) { setPlanError(response.errorDescription); return; }
      setPlans(response.plans);
      setPlanDraft(emptyPlan);
      setNotice({ title: planDraft.id ? "Plano atualizado" : "Plano criado", message: "O preço recorrente correspondente foi sincronizado com a Stripe.", tone: "info" });
    } catch { setPlanError("Não foi possível conectar ao servidor."); }
    finally { setPlanSaving(false); }
  }

  async function archivePlan(plan: SubscriptionPlan) {
    setPlanSaving(true);
    setPlanError("");
    try {
      const response = await postData<Record<string, unknown>, { error: false; plans: SubscriptionPlan[] } | ApiError>("/api/admin/plans", { type: "archive", id: plan.id });
      if ("errorDescription" in response) throw new Error(response.errorDescription);
      setPlans(response.plans);
      if (planDraft.id === plan.id) setPlanDraft(emptyPlan);
    } catch (error) { setPlanError(error instanceof Error ? error.message : "Não foi possível arquivar o plano."); }
    finally { setPlanSaving(false); }
  }

  async function saveSmtpSettings() {
    if (!smtpDraft) return; setSmtpSaving(true); setSmtpError("");
    try {
      const response = await postData<SmtpDraft, SmtpSettingsResponse>("/api/admin/smtp-settings", smtpDraft);
      if (!("settings" in response)) { setSmtpError(response.errorDescription); return; }
      setSmtpSettings(response.settings); setSmtpDraft({ ...response.settings, password: "", clearPassword: false });
      setNotice({ title: "SMTP configurado", message: response.settings.enabled ? "A recuperação de senha por e-mail está ativa." : "O envio de recuperação permanece desativado.", tone: "info" });
    } catch { setSmtpError("Não foi possível conectar ao servidor SMTP."); }
    finally { setSmtpSaving(false); }
  }

  async function notificationAction(type: "send" | "edit" | "delete", item?: AdminNotification) {
    setNotificationSaving(true); setNotificationError("");
    try {
      const body = type === "delete" ? { type, id: item?.id } : type === "edit" ? { type, ...notificationDraft } : { type, ...notificationDraft };
      const response = await postData<Record<string, unknown>, AdminNotificationsResponse>("/api/admin/notifications", body);
      if (!("notifications" in response)) { setNotificationError(response.errorDescription); return; }
      setNotifications(response.notifications); setNotificationUsers(response.users); setNotificationDraft(emptyNotification);
      setNotice({ title: type === "delete" ? "Notificação excluída" : type === "edit" ? "Notificação atualizada" : "Notificação enviada", message: type === "send" ? "A mensagem já está disponível para os destinatários." : "O histórico foi atualizado.", tone: "info" });
    } catch { setNotificationError("Não foi possível atualizar as notificações."); }
    finally { setNotificationSaving(false); }
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
            <p>Configure o sistema e gerencie as contas em áreas separadas.</p>
          </div>
          {adminTab === "users" && (
            <button
              type="button"
              className={styles.addUserButton}
              onClick={openCreateUser}
            >
              <FiPlus aria-hidden="true" />
              Adicionar usuário
            </button>
          )}
        </div>

        <div
          className={styles.adminTabs}
          role="tablist"
          aria-label="Áreas da administração"
        >
          <button
            type="button"
            role="tab"
            aria-selected={adminTab === "settings"}
            className={adminTab === "settings" ? styles.adminTabActive : ""}
            onClick={() => setAdminTab("settings")}
          >
            <FiSettings aria-hidden="true" />
            Configurações
          </button>
          <button
            type="button" role="tab" aria-selected={adminTab === "notifications"}
            className={adminTab === "notifications" ? styles.adminTabActive : ""}
            onClick={() => setAdminTab("notifications")}
          >
            <FiBell aria-hidden="true" /> Notificações
            <span>{notifications.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={adminTab === "plans"}
            className={adminTab === "plans" ? styles.adminTabActive : ""}
            onClick={() => setAdminTab("plans")}
          >
            <FiCreditCard aria-hidden="true" />
            Planos pagos
            <span>{plans.filter((plan) => plan.isActive).length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={adminTab === "users"}
            className={adminTab === "users" ? styles.adminTabActive : ""}
            onClick={() => setAdminTab("users")}
          >
            <FiUsers aria-hidden="true" />
            Usuários
            {data && <span>{data.totals.total}</span>}
          </button>
        </div>

        {adminTab === "settings" && (
          <>
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
                <p>Controle o modelo e as regras usadas no editor de Plays!</p>
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

        <section className={styles.aiSection} aria-labelledby="stripe-settings-title">
          <div className={styles.aiHeader}>
            <div className={styles.aiTitle}>
              <span className={styles.aiIcon} aria-hidden="true"><FiCreditCard /></span>
              <div>
                <span className={styles.cardLabel}>Pagamentos recorrentes</span>
                <h2 id="stripe-settings-title">Stripe</h2>
                <p>Configure a cobrança por cartão e a confirmação via webhook.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={stripeDraft?.enabled || false}
              className={`${styles.switch} ${stripeDraft?.enabled ? styles.switchEnabled : ""}`}
              disabled={!stripeDraft || stripeSaving}
              onClick={() => setStripeDraft((current) => current ? { ...current, enabled: !current.enabled } : current)}
            >
              <span aria-hidden="true" />
              {stripeDraft?.enabled ? "Ativada" : "Desativada"}
            </button>
          </div>
          {!stripeDraft ? (
            <div className={styles.aiLoading}><span className="appSpinner" /> Carregando configurações...</div>
          ) : (
            <form className={styles.aiForm} onSubmit={(event) => { event.preventDefault(); void saveStripeSettings(); }}>
              <div className={styles.aiFormGrid}>
                <label className={styles.aiField}>
                  <span>Chave secreta</span>
                  <div className={styles.aiKeyInput}><FiKey aria-hidden="true" /><input
                    type="password" autoComplete="new-password" value={stripeDraft.secretKey}
                    disabled={stripeSaving || stripeDraft.clearSecretKey || stripeSettings?.secretKeyFromEnvironment}
                    placeholder={stripeSettings?.secretKeyConfigured ? "sk_•••• configurada. Digite para substituir." : "sk_live_... ou sk_test_..."}
                    onChange={(event) => setStripeDraft((current) => current ? { ...current, secretKey: event.target.value } : current)}
                  /></div>
                  {stripeSettings?.secretKeyFromEnvironment && <small>Definida por STRIPE_SECRET_KEY no ambiente.</small>}
                </label>
                <label className={styles.aiField}>
                  <span>Segredo do webhook</span>
                  <div className={styles.aiKeyInput}><FiKey aria-hidden="true" /><input
                    type="password" autoComplete="new-password" value={stripeDraft.webhookSecret}
                    disabled={stripeSaving || stripeDraft.clearWebhookSecret || stripeSettings?.webhookSecretFromEnvironment}
                    placeholder={stripeSettings?.webhookSecretConfigured ? "whsec_•••• configurado. Digite para substituir." : "whsec_..."}
                    onChange={(event) => setStripeDraft((current) => current ? { ...current, webhookSecret: event.target.value } : current)}
                  /></div>
                  {stripeSettings?.webhookSecretFromEnvironment && <small>Definido por STRIPE_WEBHOOK_SECRET no ambiente.</small>}
                </label>
              </div>
              <div className={styles.stripeWebhook}>
                <strong>Endpoint do webhook</strong>
                <code>{typeof window === "undefined" ? "https://seu-dominio" : window.location.origin}/api/stripe/webhook</code>
                <span>Eventos: checkout.session.completed e customer.subscription.*</span>
              </div>
              <div className={styles.clearKeys}>
                {stripeSettings?.secretKeyConfigured && !stripeSettings.secretKeyFromEnvironment && <label className={styles.clearKey}><input type="checkbox" checked={stripeDraft.clearSecretKey} disabled={stripeSaving} onChange={(event) => setStripeDraft((current) => current ? { ...current, clearSecretKey: event.target.checked, secretKey: "", enabled: event.target.checked ? false : current.enabled } : current)} /> Remover chave secreta armazenada</label>}
                {stripeSettings?.webhookSecretConfigured && !stripeSettings.webhookSecretFromEnvironment && <label className={styles.clearKey}><input type="checkbox" checked={stripeDraft.clearWebhookSecret} disabled={stripeSaving} onChange={(event) => setStripeDraft((current) => current ? { ...current, clearWebhookSecret: event.target.checked, webhookSecret: "", enabled: event.target.checked ? false : current.enabled } : current)} /> Remover segredo do webhook</label>}
              </div>
              {stripeError && <p className={styles.aiError} role="alert">{stripeError}</p>}
              <div className={styles.aiFooter}>
                <p>Os segredos são criptografados e nunca voltam a ser exibidos.</p>
                <button type="submit" className={styles.aiSaveButton} disabled={stripeSaving}><FiSave /> {stripeSaving ? "Validando..." : "Salvar Stripe"}</button>
              </div>
            </form>
          )}
        </section>

        <section className={styles.aiSection} aria-labelledby="smtp-settings-title">
          <div className={styles.aiHeader}>
            <div className={styles.aiTitle}><span className={styles.aiIcon}><FiMail /></span><div><span className={styles.cardLabel}>Recuperação de senha</span><h2 id="smtp-settings-title">Servidor SMTP</h2><p>Envie links temporários pelo “Esqueci a senha”.</p></div></div>
            <button type="button" role="switch" aria-checked={smtpDraft?.enabled || false} className={`${styles.switch} ${smtpDraft?.enabled ? styles.switchEnabled : ""}`} disabled={!smtpDraft || smtpSaving || smtpSettings?.fromEnvironment} onClick={() => setSmtpDraft((current) => current ? { ...current, enabled: !current.enabled } : current)}><span />{smtpDraft?.enabled ? "Ativado" : "Desativado"}</button>
          </div>
          {!smtpDraft ? <div className={styles.aiLoading}><span className="appSpinner" /> Carregando configurações...</div> : (
            <form className={styles.aiForm} onSubmit={(event) => { event.preventDefault(); void saveSmtpSettings(); }}>
              {smtpSettings?.fromEnvironment && <div className={styles.stripeWebhook}><strong>Configuração protegida</strong><span>O SMTP foi definido por variáveis de ambiente e tem prioridade.</span></div>}
              <div className={styles.aiFormGrid}>
                <label className={styles.aiField}><span>Servidor SMTP</span><input value={smtpDraft.host} disabled={smtpSaving || smtpSettings?.fromEnvironment} placeholder="smtp.exemplo.com" onChange={(event) => setSmtpDraft((current) => current ? { ...current, host: event.target.value } : current)} required /></label>
                <label className={styles.aiField}><span>Porta</span><input type="number" min={1} max={65535} value={smtpDraft.port} disabled={smtpSaving || smtpSettings?.fromEnvironment} onChange={(event) => setSmtpDraft((current) => current ? { ...current, port: Number(event.target.value) } : current)} required /></label>
                <label className={styles.aiField}><span>Usuário SMTP</span><input value={smtpDraft.username} disabled={smtpSaving || smtpSettings?.fromEnvironment} autoComplete="off" onChange={(event) => setSmtpDraft((current) => current ? { ...current, username: event.target.value } : current)} /></label>
                <label className={styles.aiField}><span>Senha SMTP</span><div className={styles.aiKeyInput}><FiKey /><input type="password" value={smtpDraft.password} disabled={smtpSaving || smtpDraft.clearPassword || smtpSettings?.fromEnvironment} autoComplete="new-password" placeholder={smtpSettings?.passwordConfigured ? "Senha configurada. Digite para substituir." : "Senha ou token do aplicativo"} onChange={(event) => setSmtpDraft((current) => current ? { ...current, password: event.target.value } : current)} /></div></label>
                <label className={styles.aiField}><span>Nome do remetente</span><input value={smtpDraft.fromName} disabled={smtpSaving || smtpSettings?.fromEnvironment} onChange={(event) => setSmtpDraft((current) => current ? { ...current, fromName: event.target.value } : current)} required /></label>
                <label className={styles.aiField}><span>E-mail do remetente</span><input type="email" value={smtpDraft.fromEmail} disabled={smtpSaving || smtpSettings?.fromEnvironment} onChange={(event) => setSmtpDraft((current) => current ? { ...current, fromEmail: event.target.value } : current)} required /></label>
              </div>
              <label className={styles.clearKey}><input type="checkbox" checked={smtpDraft.secure} disabled={smtpSaving || smtpSettings?.fromEnvironment} onChange={(event) => setSmtpDraft((current) => current ? { ...current, secure: event.target.checked } : current)} /> Usar conexão TLS direta (normalmente porta 465)</label>
              {smtpSettings?.passwordConfigured && !smtpSettings.fromEnvironment && <label className={styles.clearKey}><input type="checkbox" checked={smtpDraft.clearPassword} disabled={smtpSaving} onChange={(event) => setSmtpDraft((current) => current ? { ...current, clearPassword: event.target.checked, password: "", enabled: event.target.checked ? false : current.enabled } : current)} /> Remover senha armazenada</label>}
              {smtpError && <p className={styles.aiError}>{smtpError}</p>}
              <div className={styles.aiFooter}><p>A senha é criptografada. Ao ativar, a conexão é testada antes de confirmar.</p><button className={styles.aiSaveButton} disabled={smtpSaving || smtpSettings?.fromEnvironment}><FiSave />{smtpSaving ? "Testando..." : "Salvar SMTP"}</button></div>
            </form>
          )}
        </section>
          </>
        )}

        {adminTab === "plans" && (
          <div className={styles.plansLayout}>
            <section className={styles.planFormCard}>
              <span className={styles.cardLabel}>{planDraft.id ? "Editar plano" : "Novo plano"}</span>
              <h2>{planDraft.id ? "Atualize o plano" : "Crie um plano pago"}</h2>
              <p>O preço será recorrente a cada 30, 60 ou 90 dias.</p>
              <form onSubmit={(event) => { event.preventDefault(); void savePlan(); }}>
                <label className={styles.aiField}><span>Nome do plano</span><input required maxLength={100} value={planDraft.name} onChange={(event) => setPlanDraft((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className={styles.aiField}><span>Descrição</span><textarea maxLength={500} value={planDraft.description} onChange={(event) => setPlanDraft((current) => ({ ...current, description: event.target.value }))} /></label>
                <div className={styles.aiFormGrid}>
                  <label className={styles.aiField}><span>Período</span><SelectField value={planDraft.durationDays} onChange={(event) => setPlanDraft((current) => ({ ...current, durationDays: Number(event.target.value) as 30 | 60 | 90 }))}><option value={30}>30 dias</option><option value={60}>60 dias</option><option value={90}>90 dias</option></SelectField></label>
                  <label className={styles.aiField}><span>Preço recorrente</span><input inputMode="numeric" value={maskCurrency(String(planDraft.amountCents))} onChange={(event) => setPlanDraft((current) => ({ ...current, amountCents: Number(event.target.value.replace(/\D/g, "") || 0) }))} /></label>
                </div>
                {planError && <p className={styles.aiError} role="alert">{planError}</p>}
                <div className={styles.planFormActions}>
                  {planDraft.id && <button type="button" onClick={() => setPlanDraft(emptyPlan)}>Cancelar</button>}
                  <button type="submit" className={styles.aiSaveButton} disabled={planSaving || planDraft.amountCents < 50}><FiSave /> {planSaving ? "Sincronizando..." : "Salvar plano"}</button>
                </div>
              </form>
            </section>
            <section className={styles.planListCard}>
              <div><span className={styles.cardLabel}>Catálogo</span><h2>Planos cadastrados</h2></div>
              {plansLoading ? <div className={styles.loading}><span className="appSpinner" /></div> : plans.length === 0 ? <div className={styles.empty}>Nenhum plano criado.</div> : (
                <div className={styles.planAdminList}>{plans.map((plan) => <article key={plan.id} className={!plan.isActive ? styles.planArchived : ""}>
                  <div><span>{plan.durationDays} dias</span><h3>{plan.name}</h3><p>{plan.description || "Sem descrição"}</p></div>
                  <strong>{(plan.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                  <small>{plan.isActive ? (plan.stripeSynced ? "Ativo na Stripe" : "Pendente") : "Arquivado"}</small>
                  <div className={styles.planRowActions}>
                    <button type="button" onClick={() => setPlanDraft({ id: plan.id, name: plan.name, description: plan.description, durationDays: plan.durationDays, amountCents: plan.amountCents })}><FiEdit2 /> Editar</button>
                    {plan.isActive && <button type="button" onClick={() => void archivePlan(plan)}><FiTrash2 /> Arquivar</button>}
                  </div>
                </article>)}</div>
              )}
            </section>
          </div>
        )}

        {adminTab === "notifications" && (
          <div className={styles.plansLayout}>
            <section className={styles.planFormCard}>
              <span className={styles.cardLabel}>{notificationDraft.id ? "Editar" : "Nova mensagem"}</span>
              <h2>{notificationDraft.id ? "Editar notificação" : "Enviar notificação"}</h2>
              <p>Envie para uma pessoa específica ou para todas as contas.</p>
              <form onSubmit={(event) => { event.preventDefault(); void notificationAction(notificationDraft.id ? "edit" : "send"); }}>
                {!notificationDraft.id && <><fieldset className={styles.roleFieldset}><legend>Destinatários</legend><div className={styles.roleOptions}><label className={`${styles.roleOption} ${notificationDraft.audience === "all" ? styles.roleOptionSelected : ""}`}><input type="radio" checked={notificationDraft.audience === "all"} onChange={() => setNotificationDraft((current) => ({ ...current, audience: "all", userId: "" }))} /><FiUsers /><span><strong>Todos</strong><small>Todas as contas do sistema</small></span></label><label className={`${styles.roleOption} ${notificationDraft.audience === "user" ? styles.roleOptionSelected : ""}`}><input type="radio" checked={notificationDraft.audience === "user"} onChange={() => setNotificationDraft((current) => ({ ...current, audience: "user" }))} /><FiUser /><span><strong>Usuário</strong><small>Uma conta específica</small></span></label></div></fieldset>{notificationDraft.audience === "user" && <><label className={styles.aiField}><span>Buscar usuário</span><input type="search" value={notificationUserSearch} placeholder="Nome, usuário ou e-mail" onChange={(event) => setNotificationUserSearch(event.target.value)} /></label><label className={styles.aiField}><span>Selecionar usuário</span><SelectField value={notificationDraft.userId} onChange={(event) => setNotificationDraft((current) => ({ ...current, userId: event.target.value }))} required><option value="">Selecione...</option>{notificationUsers.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.label}{recipient.email ? ` — ${recipient.email}` : ""}</option>)}</SelectField></label></>}</>}
                <label className={styles.aiField}><span>Título</span><input maxLength={120} value={notificationDraft.title} onChange={(event) => setNotificationDraft((current) => ({ ...current, title: event.target.value }))} required /></label>
                <label className={styles.aiField}><span>Mensagem</span><textarea maxLength={2000} value={notificationDraft.message} onChange={(event) => setNotificationDraft((current) => ({ ...current, message: event.target.value }))} required /><small>{notificationDraft.message.length} / 2.000</small></label>
                {notificationError && <p className={styles.aiError}>{notificationError}</p>}
                <div className={styles.planFormActions}>{notificationDraft.id && <button type="button" onClick={() => setNotificationDraft(emptyNotification)}>Cancelar</button>}<button type="submit" className={styles.aiSaveButton} disabled={notificationSaving || (notificationDraft.audience === "user" && !notificationDraft.userId)}><FiSend />{notificationSaving ? "Salvando..." : notificationDraft.id ? "Salvar edição" : "Enviar agora"}</button></div>
              </form>
            </section>
            <section className={styles.planListCard}><div><span className={styles.cardLabel}>Histórico</span><h2>Notificações enviadas</h2></div>{notifications.length === 0 ? <div className={styles.empty}>Nenhuma notificação enviada.</div> : <div className={styles.notificationAdminList}>{notifications.map((item) => <article key={item.id}><div><span>{item.audience === "all" ? `${item.recipientCount} destinatários` : item.recipientName || "Usuário"}</span><h3>{item.title}</h3><p>{item.message}</p><small>{formatDate(item.createdAt)}</small></div><div className={styles.planRowActions}><button type="button" onClick={() => setNotificationDraft({ id: item.id, audience: item.audience, userId: "", title: item.title, message: item.message })}><FiEdit2 /> Editar</button><button type="button" disabled={notificationSaving} onClick={() => void notificationAction("delete", item)}><FiTrash2 /> Excluir</button></div></article>)}</div>}</section>
          </div>
        )}

        {adminTab === "users" && (
          <>
        <div className={styles.stats}>
          <article>
            <FiUsers aria-hidden="true" />
            <div>
              <strong>{data?.totals.total || 0}</strong>
              <span>contas cadastradas</span>
            </div>
          </article>
          <article>
            <FiCheckCircle aria-hidden="true" />
            <div>
              <strong>{data?.totals.active || 0}</strong>
              <span>usuários com acesso</span>
            </div>
          </article>
          <article>
            <FiClock aria-hidden="true" />
            <div>
              <strong>{data?.totals.attention || 0}</strong>
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
                onChange={(event) => {
                  setSearch(event.target.value);
                  setUserPage(1);
                }}
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

          {data && data.users.length === 0 && (
            <div className={styles.empty}>Nenhum usuário encontrado.</div>
          )}

          {data && data.users.length > 0 && (
            <div className={styles.userList}>
              {data.users.map((managedUser) => {
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
                        <h3>{managedUser.fullName || managedUser.username}</h3>
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
                        <span>@{managedUser.username}</span>
                        {managedUser.email && <span>{managedUser.email}</span>}
                        {managedUser.cpf && <span>CPF {maskCpf(managedUser.cpf)}</span>}
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
          {data && data.totals.total > 10 && (
            <div className={styles.userPagination}>
              <label>
                <span>Exibir</span>
                <SelectField
                  density="compact"
                  aria-label="Usuários por página"
                  value={userPageSize}
                  onChange={(event) => {
                    setUserPageSize(
                      Number(event.target.value) as AdminPageSize
                    );
                    setUserPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={100}>100</option>
                </SelectField>
              </label>
              <span>
                Página <strong>{data.pagination.page}</strong> de{" "}
                <strong>{data.pagination.totalPages}</strong>
                {deferredSearch
                  ? ` · ${data.pagination.total} encontrados`
                  : ""}
              </span>
              <div>
                <button
                  type="button"
                  disabled={data.pagination.page <= 1}
                  onClick={() =>
                    setUserPage((current) => Math.max(1, current - 1))
                  }
                >
                  <FiChevronLeft aria-hidden="true" />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={
                    data.pagination.page >= data.pagination.totalPages
                  }
                  onClick={() => setUserPage((current) => current + 1)}
                >
                  Próxima
                  <FiChevronRight aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>
          </>
        )}
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
            ? `${pendingDelete.username}, seus Plays! e todos os dados relacionados serão removidos definitivamente.`
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

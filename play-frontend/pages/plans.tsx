import Header from "@components/Header";
import NoticeModal from "@components/NoticeModal";
import useUser from "@lib/useUser";
import styles from "@styles/plans.module.css";
import type { CurrentPlan, PlansResponse, PublicPlan } from "./api/plans";
import { FiCheck, FiCreditCard, FiExternalLink, FiRefreshCw } from "react-icons/fi";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function price(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Plans() {
  const { user } = useUser();
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: PlansResponse) => {
        if (!("plans" in payload)) throw new Error(payload.errorDescription);
        setPlans(payload.plans);
        setPaymentsEnabled(payload.paymentsEnabled);
        setHasSubscription(payload.hasSubscription);
        setCurrentPlan(payload.currentPlan);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Não foi possível carregar os planos."))
      .finally(() => setLoading(false));
  }, []);

  async function redirect(endpoint: string, body: Record<string, unknown> = {}) {
    setAction(endpoint);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (payload.error) throw new Error(payload.errorDescription || "Não foi possível continuar.");
      if (payload.upgraded) {
        const upgradedPlan = plans.find((plan) => plan.id === body.planId);
        if (upgradedPlan) setCurrentPlan({ ...upgradedPlan, source: "subscription", subscriptionId: currentPlan?.subscriptionId || null });
        setAction(null);
        return;
      }
      if (!payload.url) throw new Error("Não foi possível continuar.");
      window.location.assign(payload.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível continuar.");
      setAction(null);
    }
  }

  return (
    <main className={styles.page}>
      <Header />
      <section className={styles.content}>
        <header className={styles.hero}>
          <span><FiCreditCard /></span>
          <p>Assinatura Play!</p>
          <h1>Escolha seu período de acesso</h1>
          <p>Pagamento recorrente e seguro, exclusivamente por cartão de crédito.</p>
        </header>

        {router.query.checkout === "success" && (
          <div className={styles.success}><FiCheck /> Assinatura confirmada. Seu acesso será atualizado em instantes.</div>
        )}
        {hasSubscription && (
          <div className={styles.manage}>
            <div><strong>Você já possui uma assinatura</strong><span>Consulte cobranças, cartão ou cancelamento no portal seguro.</span></div>
            <button onClick={() => void redirect("/api/plans/portal")} disabled={action !== null}>
              <FiExternalLink /> Gerenciar assinatura
            </button>
          </div>
        )}
        {currentPlan && (
          <div className={styles.currentPlan}>
            <div><span>Seu plano atual</span><strong>{currentPlan.name}</strong><small>{currentPlan.durationDays} dias · {price(currentPlan.amountCents)}</small></div>
            <p>{currentPlan.source === "subscription" ? "Assinatura ativa" : "Plano atribuído à sua conta"}</p>
          </div>
        )}

        {loading ? <div className={styles.loading}><span className="appSpinner" /> Carregando planos...</div> : (
          <div className={styles.grid}>
            {plans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              const isUpgrade = Boolean(currentPlan && (plan.durationDays > currentPlan.durationDays || (plan.durationDays === currentPlan.durationDays && plan.amountCents > currentPlan.amountCents)));
              const isLower = Boolean(currentPlan && !isCurrent && !isUpgrade);
              return <article key={plan.id}>
                <span className={styles.duration}>{plan.durationDays} dias</span>
                <h2>{plan.name}</h2>
                <p>{plan.description || "Acesso completo a todos os recursos do Play!"}</p>
                <strong className={styles.price}>{price(plan.amountCents)}</strong>
                <small>cobrado a cada {plan.durationDays} dias</small>
                <ul><li><FiCheck /> Acesso completo</li><li><FiRefreshCw /> Renovação automática</li><li><FiCreditCard /> Somente cartão de crédito</li></ul>
                <button
                  disabled={!paymentsEnabled || isCurrent || isLower || action !== null}
                  onClick={() => void redirect("/api/plans", { planId: plan.id, ...(hasSubscription && isUpgrade ? { action: "upgrade" } : {}) })}
                >
                  {action === "/api/plans" ? (hasSubscription && isUpgrade ? "Atualizando plano..." : "Abrindo pagamento...") : isCurrent ? "Plano atual" : isLower ? "Plano inferior" : currentPlan ? "Fazer upgrade" : "Assinar plano"}
                </button>
              </article>
            })}
          </div>
        )}
        {!loading && plans.length === 0 && <p className={styles.empty}>Nenhum plano está disponível no momento.</p>}
        {!paymentsEnabled && !loading && <p className={styles.disabled}>Os pagamentos ainda não foram ativados pelo administrador.</p>}
        {user?.accessExpiresAt && <p className={styles.note}>Seu período atual é preservado ao iniciar uma assinatura antes do vencimento.</p>}
      </section>
      <NoticeModal open={error !== null} title="Não foi possível continuar" messages={error ? [error] : []} tone="error" onClose={() => setError(null)} />
    </main>
  );
}

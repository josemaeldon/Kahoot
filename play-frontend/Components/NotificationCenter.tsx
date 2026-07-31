import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiX } from "react-icons/fi";
import type { UserNotification } from "../pages/api/notifications";
import styles from "../styles/Header.module.css";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json();
      if (!payload.error) { setItems(payload.notifications); setUnread(payload.unreadCount); }
    } catch { /* polling is best effort */ }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => {
    function outside(event: MouseEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", outside); return () => document.removeEventListener("mousedown", outside);
  }, []);
  async function mark(id?: string) {
    const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { readAll: true }) });
    const payload = await response.json();
    if (!payload.error) { setItems(payload.notifications); setUnread(payload.unreadCount); }
  }
  return <div className={styles.notificationRoot} ref={root}>
    <button type="button" className={styles.notificationButton} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><FiBell />{unread > 0 && <span>{unread > 99 ? "99+" : unread}</span>}</button>
    {open && <section className={styles.notificationPanel} aria-label="Central de notificações">
      <header><div><strong>Notificações</strong><span>{unread ? `${unread} não lida${unread === 1 ? "" : "s"}` : "Tudo em dia"}</span></div><button type="button" aria-label="Fechar notificações" onClick={() => setOpen(false)}><FiX /></button></header>
      {unread > 0 && <button type="button" className={styles.readAll} onClick={() => void mark()}><FiCheck /> Marcar todas como lidas</button>}
      <div className={styles.notificationList}>{items.length === 0 ? <p>Nenhuma notificação.</p> : items.map((item) => <button type="button" key={item.id} className={item.readAt ? "" : styles.unreadNotification} onClick={() => { if (!item.readAt) void mark(item.id); }}><span className={styles.notificationDot} /><span><strong>{item.title}</strong><p>{item.message}</p><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</small></span></button>)}</div>
    </section>}
  </div>;
}

import React, { useEffect, useState } from "react";
import { FiClock, FiSave } from "react-icons/fi";
import { PLAY_TIME_OPTIONS } from "@lib/playSettingsOptions";
import type { APIResponse } from "../pages/api/play-settings";
import SelectField from "./SelectField";
import styles from "../styles/profile.module.css";

export default function PlaySettings() {
  const [time, setTime] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const aborter = new AbortController();
    fetch("/api/play-settings", {
      credentials: "same-origin",
      cache: "no-store",
      signal: aborter.signal,
    })
      .then((response) => response.json() as Promise<APIResponse>)
      .then((response) => {
        if ("defaultPlayTime" in response) setTime(response.defaultPlayTime);
        else setError(response.errorDescription);
      })
      .catch((cause) => {
        if ((cause as Error).name !== "AbortError") {
          setError("Não foi possível carregar a configuração.");
        }
      })
      .finally(() => setLoading(false));
    return () => aborter.abort();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/play-settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultPlayTime: time }),
      });
      const payload = (await response.json()) as APIResponse;
      if ("errorDescription" in payload) {
        setError(payload.errorDescription);
        return;
      }
      setTime(payload.defaultPlayTime);
      setMessage("Configuração salva.");
    } catch {
      setError("Não foi possível salvar a configuração.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.playSettingsPanel} aria-labelledby="play-settings-title">
      <div className={styles.categoryManagerHeading}>
        <div>
          <span>Configuração do sistema</span>
          <h2 id="play-settings-title">Config Play</h2>
          <p>Defina o tempo padrão aplicado às perguntas de novos Plays!</p>
        </div>
      </div>
      <div className={styles.playSettingsForm}>
        <label>
          <span><FiClock aria-hidden="true" /> Tempo padrão</span>
          <SelectField
            value={time}
            disabled={loading || saving}
            aria-label="Tempo padrão das perguntas"
            onChange={(event) => setTime(Number(event.target.value))}
          >
            {PLAY_TIME_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} segundos</option>
            ))}
          </SelectField>
        </label>
        <button type="button" className={styles.createButton} disabled={loading || saving} onClick={() => void save()}>
          <FiSave aria-hidden="true" />
          {saving ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
      {message && <p className={styles.settingsSuccess}>{message}</p>}
      {error && <p className={styles.settingsError}>{error}</p>}
    </section>
  );
}

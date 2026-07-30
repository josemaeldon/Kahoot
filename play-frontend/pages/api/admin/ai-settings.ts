import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperadmin } from "@lib/auth";
import {
  encryptApiKey,
  getAiSettings,
  type ReasoningEffort,
} from "@lib/aiSettings";
import { query } from "@lib/db";

export interface PublicAiSettings {
  enabled: boolean;
  provider: "OpenAI";
  model: string;
  reasoningEffort: ReasoningEffort;
  systemInstructions: string;
  apiKeyConfigured: boolean;
  updatedAt: string;
}

type SuccessResponse = { error: false; settings: PublicAiSettings };
type FailResponse = { error: true; errorDescription: string };
export type AiSettingsResponse = SuccessResponse | FailResponse;

const reasoningEfforts = new Set<ReasoningEffort>([
  "none",
  "low",
  "medium",
  "high",
]);
const modelPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/;

function publicSettings(
  settings: Awaited<ReturnType<typeof getAiSettings>>
): PublicAiSettings {
  return {
    enabled: settings.enabled,
    provider: "OpenAI",
    model: settings.model,
    reasoningEffort: settings.reasoningEffort,
    systemInstructions: settings.systemInstructions,
    apiKeyConfigured: settings.apiKeyConfigured,
    updatedAt: settings.updatedAt,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AiSettingsResponse>
) {
  const superadmin = await requireSuperadmin(req, res);
  if (!superadmin) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json({
        error: false,
        settings: publicSettings(await getAiSettings()),
      });
    }

    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: true, errorDescription: "Método não permitido" });
    }

    const enabled = req.body?.enabled;
    const model =
      typeof req.body?.model === "string" ? req.body.model.trim() : "";
    const reasoningEffort = req.body?.reasoningEffort as ReasoningEffort;
    const systemInstructions =
      typeof req.body?.systemInstructions === "string"
        ? req.body.systemInstructions.trim()
        : "";
    const apiKey =
      typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
    const clearApiKey = req.body?.clearApiKey === true;

    if (typeof enabled !== "boolean") {
      throw new Error("Estado da geração por IA inválido.");
    }
    if (!modelPattern.test(model)) {
      throw new Error("Informe um identificador de modelo válido.");
    }
    if (!reasoningEfforts.has(reasoningEffort)) {
      throw new Error("Esforço de raciocínio inválido.");
    }
    if (
      systemInstructions.length < 1 ||
      systemInstructions.length > 2000
    ) {
      throw new Error("As instruções devem ter entre 1 e 2.000 caracteres.");
    }
    if (apiKey && apiKey.length < 20) {
      throw new Error("A chave da API parece incompleta.");
    }
    if (clearApiKey && apiKey) {
      throw new Error("Escolha entre substituir ou remover a chave atual.");
    }

    const encryptedKey = apiKey ? encryptApiKey(apiKey) : null;
    await query(
      `update ai_settings
       set enabled = $1,
           model = $2,
           reasoning_effort = $3,
           system_instructions = $4,
           api_key_encrypted = case
             when $5::boolean then null
             when $6::text is not null then $6
             else api_key_encrypted
           end,
           updated_by = $7::uuid,
           updated_at = now()
       where id = true`,
      [
        enabled,
        model,
        reasoningEffort,
        systemInstructions,
        clearApiKey,
        encryptedKey,
        superadmin._id,
      ]
    );

    const settings = await getAiSettings();
    if (enabled && !settings.apiKeyConfigured) {
      await query(
        `update ai_settings
         set enabled = false,
             updated_at = now()
         where id = true`
      );
      throw new Error(
        "Cadastre uma chave da API da OpenAI antes de ativar a geração."
      );
    }

    return res.status(200).json({
      error: false,
      settings: publicSettings(settings),
    });
  } catch (error) {
    console.error("Falha ao atualizar configurações de IA", error);
    return res.status(400).json({
      error: true,
      errorDescription:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as configurações de IA.",
    });
  }
}

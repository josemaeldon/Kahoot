import crypto from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@lib/auth";
import { getAiSettings } from "@lib/aiSettings";
import { listCategories } from "@lib/categoryRepository";
import { query } from "@lib/db";
import type { db } from "kahoot";

interface GeneratedKahoot {
  title: string;
  questions: db.Question[];
}

type SuccessResponse = {
  error: false;
  game: GeneratedKahoot;
};
type FailResponse = { error: true; errorDescription: string };
export type AiGenerationResponse = SuccessResponse | FailResponse;

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string; code?: string };
}

const activeUsers = new Set<string>();
const lastRequestByUser = new Map<string, number>();

const kahootSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "questions"],
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "choices", "correctAnswer", "time"],
        properties: {
          question: { type: "string" },
          choices: {
            type: "array",
            items: { type: "string" },
          },
          correctAnswer: { type: "integer", enum: [0, 1, 2, 3] },
          time: { type: "integer", enum: [15] },
        },
      },
    },
  },
} as const;

function responseText(response: OpenAiResponse) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeQuestion(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function questionSimilarity(first: string, second: string) {
  const firstWords = new Set(normalizeQuestion(first).split(" ").filter(Boolean));
  const secondWords = new Set(
    normalizeQuestion(second).split(" ").filter(Boolean)
  );
  if (!firstWords.size || !secondWords.size) return 0;
  let intersection = 0;
  for (const word of firstWords) {
    if (secondWords.has(word)) intersection += 1;
  }
  return intersection / (firstWords.size + secondWords.size - intersection);
}

function findDuplicateQuestions(
  generated: db.Question[],
  existingQuestions: string[]
) {
  const duplicates: string[] = [];
  const compared = [...existingQuestions];
  for (const question of generated) {
    const generatedNormalized = normalizeQuestion(question.question);
    const duplicate = compared.some((candidate) => {
      const normalized = normalizeQuestion(candidate);
      return (
        normalized === generatedNormalized ||
        questionSimilarity(candidate, question.question) >= 0.82
      );
    });
    if (duplicate) duplicates.push(question.question);
    compared.push(question.question);
  }
  return duplicates;
}

function parseGeneratedKahoot(
  value: string,
  categoryName: string
): GeneratedKahoot {
  const parsed = JSON.parse(value) as Partial<GeneratedKahoot>;
  if (
    typeof parsed.title !== "string" ||
    !parsed.title.trim() ||
    parsed.title.trim().length > 120 ||
    !Array.isArray(parsed.questions) ||
    parsed.questions.length !== 10
  ) {
    throw new Error("A IA retornou um Kahoot incompleto.");
  }

  const questions = parsed.questions.map((question, index) => {
    if (
      typeof question?.question !== "string" ||
      !question.question.trim() ||
      question.question.trim().length > 120 ||
      !Array.isArray(question.choices) ||
      question.choices.length !== 4 ||
      question.choices.some(
        (choice) =>
          typeof choice !== "string" ||
          !choice.trim() ||
          choice.trim().length > 100
      ) ||
      new Set(question.choices.map((choice) => choice.trim().toLowerCase()))
        .size !== 4 ||
      !Number.isInteger(question.correctAnswer) ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 3 ||
      question.time !== 15
    ) {
      throw new Error(`A pergunta ${index + 1} retornada pela IA é inválida.`);
    }

    return {
      question: question.question.trim(),
      choices: question.choices.map((choice) => choice.trim()),
      correctAnswer: question.correctAnswer,
      time: question.time,
      image: null,
    };
  });

  const titlePrefix = `${categoryName} — `;
  const generatedTitle = parsed.title
    .trim()
    .replace(new RegExp(`^${escapeRegExp(categoryName)}\\s*[—:-]\\s*`, "i"), "")
    .trim();

  return {
    title: `${titlePrefix}${generatedTitle
      .slice(0, 120 - titlePrefix.length)
      .trim()}`,
    questions,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AiGenerationResponse>
) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: true, errorDescription: "Método não permitido" });
  }

  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const categoryId =
    typeof req.body?.categoryId === "string" ? req.body.categoryId : "";
  if (prompt.length < 10 || prompt.length > 2000) {
    return res.status(400).json({
      error: true,
      errorDescription: "O pedido deve ter entre 10 e 2.000 caracteres.",
    });
  }

  if (activeUsers.has(user._id)) {
    return res.status(429).json({
      error: true,
      errorDescription: "Já existe uma geração em andamento para sua conta.",
    });
  }
  const lastRequest = lastRequestByUser.get(user._id) || 0;
  if (Date.now() - lastRequest < 15_000) {
    return res.status(429).json({
      error: true,
      errorDescription: "Aguarde alguns segundos antes de gerar outro Kahoot.",
    });
  }

  activeUsers.add(user._id);
  lastRequestByUser.set(user._id, Date.now());
  try {
    const settings = await getAiSettings();
    if (!settings.enabled || !settings.apiKey) {
      return res.status(503).json({
        error: true,
        errorDescription:
          "A geração por IA ainda não foi configurada pelo superadmin.",
      });
    }
    const categories = await listCategories(user._id);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) {
      return res.status(400).json({
        error: true,
        errorDescription: "Selecione uma categoria válida para o Kahoot.",
      });
    }
    const existingResult = await query<{ question: string }>(
      `select q.question_text as question
       from questions q
       order by q.id`
    );
    const existingQuestions = existingResult.rows.map((row) => row.question);
    const referenceQuestions = existingQuestions
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 80);

    const endpoint = `${
      process.env.OPENAI_API_BASE_URL?.replace(/\/$/, "") ||
      "https://api.openai.com/v1"
    }/responses`;
    let duplicateFeedback = "";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model: settings.model,
          store: false,
          reasoning: { effort: settings.reasoningEffort },
          safety_identifier: crypto
            .createHash("sha256")
            .update(user._id)
            .digest("hex"),
          instructions: [
            "Você cria Kahoots em português do Brasil para uso educacional.",
            settings.systemInstructions,
            "Gere exatamente 10 perguntas. Cada pergunta deve ter exatamente 4 respostas distintas e apenas uma correta.",
            "O índice correctAnswer deve identificar a única resposta correta, usando valores de 0 a 3.",
            "Use exatamente 15 segundos em todas as perguntas.",
            `A categoria obrigatória é "${category.name}". O conteúdo inteiro deve pertencer a essa categoria.`,
            `Crie o título no padrão dos Kahoots públicos: "${category.name} — [tema curto e específico]".`,
            "Crie perguntas originais. Não repita nem apenas reformule perguntas já existentes.",
            referenceQuestions.length
              ? `Evite especialmente estas perguntas existentes:\n${referenceQuestions
                  .map((question) => `- ${question}`)
                  .join("\n")}`
              : "",
            duplicateFeedback,
            "Não inclua explicações, comentários ou conteúdo fora do formato solicitado.",
          ]
            .filter(Boolean)
            .join("\n"),
          input: `Crie um Kahoot da categoria "${category.name}" com base neste pedido do usuário:\n\n${prompt}`,
          max_output_tokens: 5000,
          text: {
            verbosity: "low",
            format: {
              type: "json_schema",
              name: "kahoot_quiz",
              strict: true,
              schema: kahootSchema,
            },
          },
        }),
      });

      const payload = (await upstream.json()) as OpenAiResponse;
      if (!upstream.ok) {
        console.error("Falha na API da OpenAI", {
          status: upstream.status,
          code: payload.error?.code,
          message: payload.error?.message,
        });
        const message =
          upstream.status === 401
            ? "A chave da API da OpenAI configurada é inválida."
            : upstream.status === 429
              ? "O limite de uso da IA foi atingido. Tente novamente mais tarde."
              : "A OpenAI não conseguiu gerar o Kahoot agora.";
        return res.status(502).json({ error: true, errorDescription: message });
      }

      const text = responseText(payload);
      if (!text) throw new Error("A IA não retornou conteúdo utilizável.");
      const game = parseGeneratedKahoot(text, category.name);
      const duplicates = findDuplicateQuestions(
        game.questions,
        existingQuestions
      );
      if (!duplicates.length) {
        return res.status(200).json({ error: false, game });
      }
      duplicateFeedback = `A tentativa anterior repetiu estas perguntas e deve ser refeita com assuntos diferentes:\n${duplicates
        .map((question) => `- ${question}`)
        .join("\n")}`;
    }

    throw new Error(
      "A IA repetiu perguntas já existentes. Tente um tema mais específico."
    );
  } catch (error) {
    console.error("Falha ao gerar Kahoot com IA", error);
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return res.status(502).json({
      error: true,
      errorDescription: timedOut
        ? "A geração demorou demais. Tente novamente."
        : error instanceof SyntaxError
          ? "A IA retornou uma resposta que não pôde ser processada."
          : error instanceof Error
            ? error.message
            : "Não foi possível gerar o Kahoot.",
    });
  } finally {
    activeUsers.delete(user._id);
  }
}

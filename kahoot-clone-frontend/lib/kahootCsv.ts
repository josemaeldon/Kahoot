import type { db } from "kahoot";

export class KahootCsvError extends Error {}

const expectedHeaders = [
  "titulo_quiz",
  "pergunta",
  "resposta_1",
  "resposta_2",
  "resposta_3",
  "resposta_4",
  "resposta_correta",
  "tempo_segundos",
] as const;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function parseRows(source: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === delimiter && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  if (quoted) {
    throw new KahootCsvError(
      "O arquivo possui aspas abertas. Revise a formatação do CSV."
    );
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function detectDelimiter(headerLine: string) {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

export function parseKahootCsv(rawSource: string): db.KahootGame {
  let source = rawSource.replace(/^\uFEFF/, "").trim();
  if (!source) {
    throw new KahootCsvError("O arquivo CSV está vazio.");
  }

  let delimiter = detectDelimiter(source.split(/\r?\n/, 1)[0]);
  const separatorDeclaration = source.match(/^sep=(.)\r?\n/i);
  if (separatorDeclaration) {
    delimiter = separatorDeclaration[1];
    source = source.slice(separatorDeclaration[0].length);
  }

  const rows = parseRows(source, delimiter);
  if (rows.length < 2) {
    throw new KahootCsvError(
      "O arquivo precisa ter o cabeçalho e ao menos uma pergunta."
    );
  }

  const headers = rows[0].map(normalizeHeader);
  const positions = new Map(headers.map((header, index) => [header, index]));
  const missingHeaders = expectedHeaders.filter(
    (header) => !positions.has(header)
  );
  if (missingHeaders.length > 0) {
    throw new KahootCsvError(
      `Colunas ausentes: ${missingHeaders.join(", ")}. Use o modelo disponível para download.`
    );
  }

  function read(row: string[], header: (typeof expectedHeaders)[number]) {
    return (row[positions.get(header)] || "").trim();
  }

  let title = "";
  const questions: db.Question[] = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const csvLine = rowIndex + 2;
    const rowTitle = read(row, "titulo_quiz");
    if (rowTitle) {
      if (title && title !== rowTitle) {
        throw new KahootCsvError(
          `Linha ${csvLine}: use o mesmo título em todas as perguntas ou deixe o título em branco após a primeira linha.`
        );
      }
      title = rowTitle;
    }

    const question = read(row, "pergunta");
    const choices = [
      read(row, "resposta_1"),
      read(row, "resposta_2"),
      read(row, "resposta_3"),
      read(row, "resposta_4"),
    ];
    const correctAnswerValue = read(row, "resposta_correta");
    const timeValue = read(row, "tempo_segundos") || "30";

    if (!question) {
      throw new KahootCsvError(
        `Linha ${csvLine}: o enunciado da pergunta é obrigatório.`
      );
    }
    if (question.length > 120) {
      throw new KahootCsvError(
        `Linha ${csvLine}: a pergunta deve ter no máximo 120 caracteres.`
      );
    }
    if (!choices[0] || !choices[1]) {
      throw new KahootCsvError(
        `Linha ${csvLine}: preencha pelo menos resposta_1 e resposta_2.`
      );
    }
    if (choices.some((choice) => choice.length > 120)) {
      throw new KahootCsvError(
        `Linha ${csvLine}: cada resposta deve ter no máximo 120 caracteres.`
      );
    }

    const correctAnswer = Number(correctAnswerValue);
    if (
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 1 ||
      correctAnswer > 4 ||
      !choices[correctAnswer - 1]
    ) {
      throw new KahootCsvError(
        `Linha ${csvLine}: resposta_correta deve ser um número de 1 a 4 apontando para uma resposta preenchida.`
      );
    }

    const time = Number(timeValue);
    if (!Number.isInteger(time) || time < 5 || time > 300) {
      throw new KahootCsvError(
        `Linha ${csvLine}: tempo_segundos deve ser um número inteiro entre 5 e 300.`
      );
    }

    questions.push({
      question,
      choices,
      correctAnswer: correctAnswer - 1,
      time,
      image: null,
    });
  });

  if (!title) {
    throw new KahootCsvError(
      "Informe o titulo_quiz na primeira linha de pergunta."
    );
  }
  if (title.length > 120) {
    throw new KahootCsvError("O título deve ter no máximo 120 caracteres.");
  }
  if (questions.length > 100) {
    throw new KahootCsvError("O arquivo pode conter no máximo 100 perguntas.");
  }

  return {
    _id: "",
    author_id: "",
    author_username: "",
    title,
    categoryId: "",
    date: 0,
    questions,
  };
}

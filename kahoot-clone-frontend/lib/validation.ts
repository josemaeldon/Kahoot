import type { db } from "kahoot";

export class ValidationError extends Error {}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUsername(usernameValue: unknown) {
  const username = typeof usernameValue === "string" ? usernameValue.trim() : "";

  if (!/^[\p{L}\p{N}_.-]{3,40}$/u.test(username)) {
    throw new ValidationError(
      "O usuário deve ter de 3 a 40 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado."
    );
  }
  return username;
}

export function validatePassword(passwordValue: unknown) {
  const password = typeof passwordValue === "string" ? passwordValue : "";
  if (password.length < 8 || password.length > 128) {
    throw new ValidationError("A senha deve ter entre 8 e 128 caracteres.");
  }
  return password;
}

export function validateWhatsapp(whatsappValue: unknown) {
  const whatsapp =
    typeof whatsappValue === "string"
      ? whatsappValue.replace(/\D/g, "")
      : "";

  if (!/^[0-9]{10,15}$/.test(whatsapp)) {
    throw new ValidationError(
      "Informe um número de WhatsApp válido com DDD."
    );
  }
  return whatsapp;
}

export function validateCredentials(usernameValue: unknown, passwordValue: unknown) {
  return {
    username: validateUsername(usernameValue),
    password: validatePassword(passwordValue),
  };
}

export function validateGame(input: unknown): db.KahootGame {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Quiz inválido.");
  }

  const candidate = input as Partial<db.KahootGame>;
  const categoryId =
    typeof candidate.categoryId === "string" ? candidate.categoryId : "";
  if (!UUID_PATTERN.test(categoryId)) {
    throw new ValidationError("Selecione uma categoria para o Kahoot.");
  }
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  if (!title || title.length > 160) {
    throw new ValidationError("O título deve ter entre 1 e 160 caracteres.");
  }
  if (
    !Array.isArray(candidate.questions) ||
    candidate.questions.length < 1 ||
    candidate.questions.length > 100
  ) {
    throw new ValidationError("O quiz deve ter entre 1 e 100 perguntas.");
  }

  const questions = candidate.questions.map((item, questionIndex) => {
    if (!item || typeof item !== "object") {
      throw new ValidationError(`Pergunta ${questionIndex + 1} inválida.`);
    }

    const question =
      typeof item.question === "string" ? item.question.trim() : "";
    if (!question || question.length > 500) {
      throw new ValidationError(
        `A pergunta ${questionIndex + 1} deve ter entre 1 e 500 caracteres.`
      );
    }

    const image =
      typeof item.image === "string" && item.image !== ""
        ? item.image
        : null;
    if (
      image &&
      (image.length > 750000 ||
        !/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(image))
    ) {
      throw new ValidationError(
        `A imagem da pergunta ${questionIndex + 1} é inválida ou muito grande.`
      );
    }

    if (!Array.isArray(item.choices)) {
      throw new ValidationError(
        `A pergunta ${questionIndex + 1} precisa de alternativas.`
      );
    }

    const rawChoices = item.choices.slice(0, 4).map((choice) =>
      typeof choice === "string" ? choice.trim() : ""
    );
    while (rawChoices.at(-1) === "") rawChoices.pop();

    if (
      rawChoices.length < 2 ||
      rawChoices.some((choice) => !choice || choice.length > 300)
    ) {
      throw new ValidationError(
        `A pergunta ${questionIndex + 1} deve ter de 2 a 4 alternativas preenchidas.`
      );
    }

    const correctAnswer = Number(item.correctAnswer);
    if (
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= rawChoices.length
    ) {
      throw new ValidationError(
        `Selecione uma resposta correta válida na pergunta ${questionIndex + 1}.`
      );
    }

    const time = Number(item.time);
    if (!Number.isInteger(time) || time < 5 || time > 300) {
      throw new ValidationError(
        `O tempo da pergunta ${questionIndex + 1} deve ficar entre 5 e 300 segundos.`
      );
    }

    return { question, image, choices: rawChoices, correctAnswer, time };
  });

  return {
    _id: typeof candidate._id === "string" ? candidate._id : "",
    author_id: "",
    author_username: "",
    title,
    categoryId,
    date: 0,
    questions,
  };
}

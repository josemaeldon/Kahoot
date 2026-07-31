import type { db } from "play";

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

export function validateFullName(value: unknown) {
  const fullName = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (
    fullName.length < 5 ||
    fullName.length > 160 ||
    !/^[\p{L}][\p{L}'’-]+(?:\s+[\p{L}][\p{L}'’-]+)+$/u.test(fullName)
  ) {
    throw new ValidationError("Informe seu nome completo, com nome e sobrenome.");
  }
  return fullName;
}

export function validateEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email)
  ) {
    throw new ValidationError("Informe um e-mail válido.");
  }
  return email;
}

export function validateCpf(value: unknown) {
  const cpf = typeof value === "string" ? value.replace(/\D/g, "") : "";
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    throw new ValidationError("Informe um CPF válido.");
  }
  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  if (digit(9) !== Number(cpf[9]) || digit(10) !== Number(cpf[10])) {
    throw new ValidationError("Informe um CPF válido.");
  }
  return cpf;
}

export function validateCnpj(value: unknown) {
  const cnpj = typeof value === "string" ? value.replace(/\D/g, "") : "";
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    throw new ValidationError("Informe um CNPJ válido.");
  }

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(`${cnpj.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (first !== Number(cnpj[12]) || second !== Number(cnpj[13])) {
    throw new ValidationError("Informe um CNPJ válido.");
  }
  return cnpj;
}

export function validateCpfOrCnpj(value: unknown) {
  const document = typeof value === "string" ? value.replace(/\D/g, "") : "";
  if (document.length === 11) return validateCpf(document);
  if (document.length === 14) return validateCnpj(document);
  throw new ValidationError("Informe um CPF ou CNPJ válido.");
}

export function validateCredentials(usernameValue: unknown, passwordValue: unknown) {
  return {
    username: validateUsername(usernameValue),
    password: validatePassword(passwordValue),
  };
}

export function validateGame(input: unknown): db.PlayGame {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Play! inválido.");
  }

  const candidate = input as Partial<db.PlayGame>;
  const categoryId =
    typeof candidate.categoryId === "string" ? candidate.categoryId : "";
  if (!UUID_PATTERN.test(categoryId)) {
    throw new ValidationError("Selecione uma categoria para o Play!");
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
    throw new ValidationError("O Play! deve ter entre 1 e 100 perguntas.");
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
    isPublic: candidate.isPublic === true,
    folderId:
      typeof candidate.folderId === "string" && UUID_PATTERN.test(candidate.folderId)
        ? candidate.folderId
        : null,
    categoryId,
    date: 0,
    questions,
  };
}

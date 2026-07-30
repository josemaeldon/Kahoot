import { expect, test } from "@playwright/test";
import jwt from "jsonwebtoken";
import path from "node:path";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

const staleSessionToken = jwt.sign(
  {
    _id: "00000000-0000-4000-8000-000000000999",
    username: "usuario_removido",
  },
  "local_development_secret_change_me_123456789",
  { algorithm: "HS256", expiresIn: "1h" }
);

test("sessão sem usuário é encerrada antes de salvar", async ({ browser }) => {
  const apiContext = await browser.newContext();
  await apiContext.addCookies([
    {
      name: "accessToken",
      value: staleSessionToken,
      url: baseUrl,
    },
  ]);

  const createResponse = await apiContext.request.post("/api/create", {
    data: {
      game: {
        _id: "",
        author_id: "",
        author_username: "",
        title: "Quiz sem usuário",
        date: 0,
        questions: [
          {
            question: "Pergunta válida?",
            choices: ["Sim", "Não", "", ""],
            correctAnswer: 0,
            time: 30,
          },
        ],
      },
    },
  });
  expect(createResponse.status()).toBe(401);
  await expect(createResponse.json()).resolves.toMatchObject({
    error: true,
    errorDescription: "Sessão inválida ou expirada",
  });
  await apiContext.close();

  const pageContext = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
  });
  await pageContext.addCookies([
    {
      name: "accessToken",
      value: staleSessionToken,
      url: baseUrl,
    },
  ]);
  const page = await pageContext.newPage();
  await page.goto("/create");
  await expect(page).toHaveURL(/\/auth\/login\?redirectOnLogin=%2Fcreate/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
  await page.screenshot({ path: "/tmp/kahoot-stale-session-login.png" });
  await pageContext.close();
});

test("cadastro, criação de quiz e partida completa", async ({ browser }) => {
  const hostContext = await browser.newContext({ viewport: { width: 1536, height: 1024 } });
  const host = await hostContext.newPage();
  const browserProblems: string[] = [];
  host.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      browserProblems.push(`${message.type()}: ${message.text()}`);
    }
  });
  host.on("pageerror", (error) =>
    browserProblems.push(`pageerror at ${host.url()}: ${error.message}`)
  );

  await host.goto("/");
  await expect(host).toHaveTitle("Kahoot");
  await expect(host.getByRole("button", { name: "Entrar" })).toBeVisible();
  await host.screenshot({ path: "/tmp/kahoot-home-desktop.png" });

  await host.goto("/auth/login");
  await host.screenshot({ path: "/tmp/kahoot-login-desktop.png" });
  await host.getByLabel("Usuário").fill("usuario_inexistente");
  await host.getByLabel("Senha").fill("SenhaInvalida123!");
  await host.getByRole("button", { name: "Entrar" }).click();
  const loginErrorModal = host.getByRole("alertdialog", {
    name: "Não foi possível entrar",
  });
  await expect(loginErrorModal).toBeVisible();
  await expect(loginErrorModal.getByText("Usuário ou senha inválidos.")).toBeVisible();
  await loginErrorModal.getByRole("button", { name: "Entendi" }).click();
  browserProblems.length = 0;

  await host.goto("/auth/signup");
  await host.screenshot({ path: "/tmp/kahoot-signup-desktop.png" });
  const uniqueUsername = `e2e_${Date.now()}`;
  await host.getByLabel("Usuário").fill(uniqueUsername);
  await host.getByPlaceholder("Digite sua senha").fill("SenhaTeste123!");
  await host.getByRole("button", { name: "Criar conta" }).click();
  const whatsappRequiredModal = host.getByRole("alertdialog", {
    name: "Não foi possível criar a conta",
  });
  await expect(
    whatsappRequiredModal.getByText(
      "Informe um número de WhatsApp válido com DDD."
    )
  ).toBeVisible();
  await whatsappRequiredModal.getByRole("button", { name: "Entendi" }).click();
  browserProblems.length = 0;
  await host.getByLabel("WhatsApp").fill("(91) 99999-9999");
  await host.getByRole("button", { name: "Criar conta" }).click();
  await expect(host).toHaveURL("/");

  await host.getByRole("button", { name: "Criar um quiz" }).click();
  await expect(host).toHaveURL("/profile");
  await host.screenshot({ path: "/tmp/kahoot-profile-empty-desktop.png" });

  await host.getByRole("button", { name: "Editar dados do usuário" }).click();
  const accountModal = host.getByRole("dialog", {
    name: "Editar dados do usuário",
  });
  await expect(accountModal).toBeVisible();
  const editedUsername = `editado_${Date.now()}`;
  await accountModal.getByLabel("Usuário").fill(editedUsername);
  await accountModal.getByLabel("WhatsApp").fill("(91) 98888-7777");
  await accountModal.getByLabel("Senha atual").fill("SenhaTeste123!");
  await accountModal.getByLabel("Nova senha").fill("NovaSenhaTeste123!");
  await expect(accountModal).toHaveCSS("opacity", "1");
  await host.screenshot({ path: "/tmp/kahoot-account-modal.png" });
  await accountModal.getByRole("button", { name: "Salvar alterações" }).click();
  const accountUpdatedModal = host.getByRole("alertdialog", {
    name: "Dados atualizados",
  });
  await expect(accountUpdatedModal).toBeVisible();
  await accountUpdatedModal.getByRole("button", { name: "Entendi" }).click();
  await expect(
    host.getByRole("button", { name: "Editar dados do usuário" })
  ).toContainText(editedUsername);

  await host.getByRole("button", { name: "Sair" }).click();
  await expect(host).toHaveURL("/auth/login");
  await host.getByLabel("Usuário").fill(editedUsername);
  await host.getByLabel("Senha").fill("NovaSenhaTeste123!");
  await host.getByRole("button", { name: "Entrar" }).click();
  await expect(host).toHaveURL("/");
  await host.getByRole("button", { name: "Criar um quiz" }).click();
  await expect(host).toHaveURL("/profile");

  await host.getByRole("button", { name: "Criar Kahoot" }).first().click();
  await expect(host).toHaveURL("/create");

  await host.locator('[data-placeholder="Questão..."]').fill("Quanto é 2 + 2?");
  await host.locator('[data-placeholder="Resposta 1"]').fill("4");
  await host.locator('[data-placeholder="Resposta 2"]').fill("3");
  await host
    .locator('input[accept="image/jpeg,image/png,image/webp"]')
    .setInputFiles(
      path.resolve(process.cwd(), "../design/concepts/home-desktop.png")
    );
  await expect(
    host.getByAltText("Prévia da imagem da questão")
  ).toBeVisible();
  await host.screenshot({ path: "/tmp/kahoot-create-with-image.png" });
  await host.getByRole("button", { name: "Salvar" }).click();
  const validationModal = host.getByRole("alertdialog", {
    name: "Revise o quiz",
  });
  await expect(validationModal).toBeVisible();
  await expect(
    validationModal.getByText("Informe um título para o quiz.")
  ).toBeVisible();
  await expect(validationModal).toHaveCSS("opacity", "1");
  await host.screenshot({ path: "/tmp/kahoot-create-validation-modal.png" });
  await validationModal.getByRole("button", { name: "Entendi" }).click();
  await expect(validationModal).toBeHidden();

  await host
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: "Matemática" });
  await host.getByPlaceholder("Digite o título do Kahoot...").fill("Quiz E2E");
  await host.getByRole("button", { name: "Salvar" }).click();
  await expect(host).toHaveURL("/profile");
  await expect(
    host.getByRole("heading", { name: "Quiz E2E" })
  ).toBeVisible();
  await host.screenshot({ path: "/tmp/kahoot-profile-desktop.png" });

  await host.setViewportSize({ width: 390, height: 844 });
  await expect(
    host.getByRole("link", { name: "Meus quizzes" })
  ).toBeVisible();
  await host.screenshot({ path: "/tmp/kahoot-profile-mobile-nav.png" });
  await host.getByRole("link", { name: "Meus quizzes" }).click();
  await expect(host).toHaveURL("/profile");
  await host.setViewportSize({ width: 1536, height: 1024 });

  await host.getByRole("button", { name: "Jogar" }).click();
  await expect(host).toHaveURL(/\/host\?gameId=/);
  const gameId = new URL(host.url()).searchParams.get("gameId");
  expect(gameId).toBeTruthy();
  await expect(host.getByText("Game Pin:")).toBeVisible();

  const pinContainer = host.locator('[class*="pinCopy"]');
  const pinText = (await pinContainer.textContent()) || "";
  const pin = pinText.match(/\d{3}\s*\d{3}/)?.[0].replace(/\s/g, "");
  expect(pin).toMatch(/^\d{6}$/);
  await host.screenshot({ path: "/tmp/kahoot-host-lobby.png" });

  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const player = await playerContext.newPage();
  player.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      browserProblems.push(`player ${message.type()}: ${message.text()}`);
    }
  });
  player.on("pageerror", (error) =>
    browserProblems.push(`player pageerror: ${error.message}`)
  );

  await player.goto("/play");
  await player.screenshot({ path: "/tmp/kahoot-player-join-mobile.png" });
  await player.getByRole("button", { name: "Entrar na sala" }).click();
  const playerErrorModal = player.getByRole("alertdialog", {
    name: "Não foi possível entrar na sala",
  });
  await expect(playerErrorModal.getByText("Informe um PIN de 6 números.")).toBeVisible();
  await playerErrorModal.getByRole("button", { name: "Entendi" }).click();
  await player.getByPlaceholder("Game PIN").fill(pin!);
  await player.getByPlaceholder("Seu nome").fill("Jogador E2E");
  await player.getByRole("button", { name: "Entrar na sala" }).click();
  await expect(player.getByText("Você está dentro!")).toBeVisible();
  await expect(host.getByText("Jogador E2E")).toBeVisible();

  await host.getByRole("button", { name: "Começar", exact: true }).click();
  await expect(host.getByText("Quanto é 2 + 2?")).toBeVisible();
  await expect(
    host.getByAltText("Imagem da pergunta: Quanto é 2 + 2?")
  ).toBeVisible();
  await expect(
    host.getByRole("button", { name: "Entrar em tela cheia" })
  ).toBeVisible();
  await host.getByRole("button", { name: "Sair", exact: true }).click();
  const exitConfirmation = host.getByRole("alertdialog", {
    name: "Sair da partida?",
  });
  await expect(exitConfirmation).toBeVisible();
  await exitConfirmation.getByRole("button", { name: "Cancelar" }).click();
  await expect(exitConfirmation).toBeHidden();
  await host.screenshot({ path: "/tmp/kahoot-host-question.png" });
  await host.setViewportSize({ width: 390, height: 844 });
  await expect(
    host.getByRole("button", { name: "Entrar em tela cheia" })
  ).toBeVisible();
  await host.screenshot({ path: "/tmp/kahoot-host-question-mobile.png" });
  await host.setViewportSize({ width: 1536, height: 1024 });

  await expect(player.locator('[class*="answerGrid"] > button')).toHaveCount(2);
  await player.screenshot({ path: "/tmp/kahoot-player-answer-mobile.png" });

  const latePlayerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const latePlayer = await latePlayerContext.newPage();
  latePlayer.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      browserProblems.push(`late player ${message.type()}: ${message.text()}`);
    }
  });
  latePlayer.on("pageerror", (error) =>
    browserProblems.push(`late player pageerror: ${error.message}`)
  );
  await latePlayer.goto("/play");
  await latePlayer.getByPlaceholder("Game PIN").fill(pin!);
  await latePlayer.getByPlaceholder("Seu nome").fill("Jogador atrasado");
  await latePlayer.getByRole("button", { name: "Entrar na sala" }).click();
  await expect(latePlayer.locator('[class*="answerGrid"] > button')).toHaveCount(2);
  await latePlayer.screenshot({
    path: "/tmp/kahoot-player-late-join-mobile.png",
  });

  const hostAnswers = host.locator('[class*="grid"] > article');
  const correctAnswerPosition = await hostAnswers
    .evaluateAll((answers) =>
      answers.findIndex((answer) => answer.textContent?.trim() === "4")
    );
  expect(correctAnswerPosition).toBeGreaterThanOrEqual(0);
  await player
    .locator('[class*="answerGrid"] > button')
    .nth(correctAnswerPosition)
    .click();
  await latePlayer
    .locator('[class*="answerGrid"] > button')
    .nth(correctAnswerPosition)
    .click();
  await expect(player.getByText(/Você acertou!/)).toBeVisible();
  await expect(player.getByText("Total: 1000 pontos")).toBeVisible();
  await expect(latePlayer.getByText(/Você acertou!/)).toBeVisible();
  await expect(latePlayer.getByText("Total: 909 pontos")).toBeVisible();
  await player.screenshot({ path: "/tmp/kahoot-player-result-mobile.png" });

  await expect(host.getByText("Quanto é 2 + 2?")).toBeVisible();
  await host.getByRole("button", { name: "Próximo" }).click();
  await expect(host.getByText("Classificação:")).toBeVisible();
  await host.getByRole("button", { name: "Próximo" }).click();
  await expect(host.getByText("Resultado final")).toBeVisible();
  await expect(host.getByText("1000 pontos")).toBeVisible();
  await expect(player).toHaveURL("/play");
  await expect(
    player.getByRole("heading", { name: "Classificação" })
  ).toBeVisible();
  await expect(player.getByText("Sua posição:")).toContainText("1º lugar");
  await expect(player.getByText("Jogador E2E")).toBeVisible();
  await expect(player.getByText("Jogador atrasado")).toBeVisible();
  await expect(player.getByText("1000 pontos")).toBeVisible();
  await player
    .getByRole("button", { name: "Entrar em uma nova sala" })
    .click();
  await expect(
    player.getByRole("heading", { name: "Entre na sala" })
  ).toBeVisible();
  await expect(player.getByPlaceholder("Game PIN")).toHaveValue("");
  await host.waitForTimeout(250);
  await host.screenshot({ path: "/tmp/kahoot-final-ranking.png" });

  await host.goto(`/host?gameId=${gameId}`);
  await expect(host.getByText("Game Pin:")).toBeVisible();
  await host.setViewportSize({ width: 390, height: 844 });
  await host.screenshot({ path: "/tmp/kahoot-host-exit-mobile.png" });
  await host.getByRole("button", { name: "Sair", exact: true }).click();
  const lobbyExitConfirmation = host.getByRole("alertdialog", {
    name: "Sair da partida?",
  });
  await expect(lobbyExitConfirmation).toBeVisible();
  await lobbyExitConfirmation
    .getByRole("button", { name: "Sair e encerrar" })
    .click();
  await expect(host).toHaveURL("/profile");

  const mobileOverflow = await player.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(mobileOverflow).toBe(false);
  expect(browserProblems).toEqual([]);

  const cleanup = await host.request.post("/api/deleteOneGame", {
    data: { gameId },
  });
  expect(cleanup.ok()).toBe(true);

  await playerContext.close();
  await latePlayerContext.close();
  await hostContext.close();
});

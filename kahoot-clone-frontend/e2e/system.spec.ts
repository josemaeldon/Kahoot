import { expect, test } from "@playwright/test";
import jwt from "jsonwebtoken";
import path from "node:path";

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
      url: "http://127.0.0.1:3000",
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
      url: "http://127.0.0.1:3000",
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
  await expect(host).toHaveTitle("Kahoot Clone");
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
  await accountModal.getByLabel("Senha atual").fill("SenhaTeste123!");
  await accountModal.getByLabel("Nova senha").fill("NovaSenhaTeste123!");
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

  await host.getByRole("button", { name: "Criar meu primeiro quiz" }).click();
  await expect(host).toHaveURL("/create");

  await host.locator('[data-placeholder="Questão..."]').fill("Quanto é 2 + 2?");
  await host.locator('[data-placeholder="Resposta 1"]').fill("4");
  await host.locator('[data-placeholder="Resposta 2"]').fill("3");
  await host.locator('input[type="file"]').setInputFiles(
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

  await host.getByPlaceholder("Digite o título do Kahoot...").fill("Quiz E2E");
  await host.getByRole("button", { name: "Salvar" }).click();
  await expect(host).toHaveURL("/profile");
  await expect(host.getByText("Quiz E2E")).toBeVisible();
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
  await host.screenshot({ path: "/tmp/kahoot-host-question.png" });
  await expect(player.locator('[class*="answerGrid"] > button')).toHaveCount(2);
  await player.screenshot({ path: "/tmp/kahoot-player-answer-mobile.png" });
  await player.locator('[class*="answerGrid"] > button').first().click();
  await expect(player.getByText(/Você acertou!/)).toBeVisible();
  await expect(player.getByText("Total: 1000 pontos")).toBeVisible();
  await player.screenshot({ path: "/tmp/kahoot-player-result-mobile.png" });

  await expect(host.getByText("Quanto é 2 + 2?")).toBeVisible();
  await host.getByRole("button", { name: "Próximo" }).click();
  await expect(host.getByText("Classificação:")).toBeVisible();
  await host.getByRole("button", { name: "Próximo" }).click();
  await expect(host.getByText("Resultado final")).toBeVisible();
  await expect(host.getByText("1000 pontos")).toBeVisible();
  await host.waitForTimeout(250);
  await host.screenshot({ path: "/tmp/kahoot-final-ranking.png" });
  await expect(player).toHaveURL("/");

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
  await hostContext.close();
});

import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const databaseUrl = process.env.E2E_DATABASE_URL;

function validCpf(seed: number) {
  const digits = String(seed % 1_000_000_000).padStart(9, "0").split("").map(Number);
  if (digits.every((digit) => digit === digits[0])) digits[8] = (digits[8] + 1) % 10;
  for (const length of [9, 10]) {
    const sum = digits.slice(0, length).reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    digits.push(remainder === 10 ? 0 : remainder);
  }
  return digits.join("");
}

function validCnpj(seed: number) {
  const base = `12${String(seed % 10_000_000_000).padStart(10, "0")}`.split("").map(Number);
  const addDigit = (weights: number[]) => {
    const sum = base.reduce((total, digit, index) => total + digit * weights[index], 0);
    const remainder = sum % 11;
    base.push(remainder < 2 ? 0 : 11 - remainder);
  };
  addDigit([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  addDigit([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return base.join("");
}

test("conta completa, login por e-mail e atribuição administrativa de plano", async ({ page }) => {
  test.skip(!databaseUrl, "E2E_DATABASE_URL é obrigatório para preparar o administrador e o plano.");
  const pool = new Pool({ connectionString: databaseUrl });
  const seed = Date.now();
  const username = `recursos_${seed}`;
  const originalEmail = `${username}@example.com`;
  const editedEmail = `editado_${seed}@example.com`;
  const adminEmail = `admin_${seed}@example.com`;
  const adminPassword = "SenhaAdminTeste123!";
  const planName = `Plano E2E ${seed}`;
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 4);
    await pool.query(
      `insert into users (full_name, email, cpf, username, whatsapp, password_hash, role, is_enabled, access_expires_at)
       values ($1,$2,$3,$4,$5,$6,'superadmin',true,null)`,
      ["Administrador Teste", adminEmail, validCpf(seed + 1), `admin_${seed}`, "11999999999", passwordHash]
    );
    const plan = await pool.query<{ id: string }>(
      `insert into subscription_plans (name, description, duration_days, amount_cents, is_active)
       values ($1,'Plano preparado para o teste',60,1990,true)
       returning id::text`,
      [planName]
    );

    await page.goto("/auth/login");
    await expect(page).toHaveTitle("Play!");
    await expect(page.getByRole("link", { name: "Esqueci a senha" })).toBeVisible();
    await page.screenshot({ path: "/tmp/play-login-account-features.png" });

    await page.goto("/auth/signup");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByLabel("Nome completo")).toBeFocused();
    await page.getByLabel("Nome completo").fill("Pessoa Jurídica Teste");
    await page.getByLabel("E-mail").fill(originalEmail);
    await page.getByLabel("CPF ou CNPJ").fill(validCnpj(seed));
    await page.getByLabel("Usuário").fill(username);
    await page.getByLabel("WhatsApp").fill("(11) 98888-7777");
    await page.locator("#password").fill("SenhaUsuarioTeste123!");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: "Editar dados do usuário" }).click();
    const account = page.getByRole("dialog", { name: "Editar dados do usuário" });
    await expect(account.getByLabel("Nome completo")).toHaveValue("Pessoa Jurídica Teste");
    await expect(account.getByLabel("E-mail")).toHaveValue(originalEmail);
    await expect(account.getByLabel("CPF ou CNPJ")).toHaveValue(/\//);
    await account.getByLabel("Nome completo").fill("Pessoa Editada Completa");
    await account.getByLabel("E-mail").fill(editedEmail);
    await account.getByLabel("CPF ou CNPJ").fill(validCpf(seed + 2));
    await account.getByLabel("Usuário").fill(`editado_${seed}`);
    await account.getByLabel("WhatsApp").fill("(11) 97777-6666");
    await account.getByLabel("Senha atual").fill("SenhaUsuarioTeste123!");
    await account.getByLabel("Nova senha").fill("SenhaNovaUsuario123!");
    await page.screenshot({ path: "/tmp/play-account-complete-edit.png" });
    await account.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("alertdialog", { name: "Dados atualizados" })).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Entendi" }).click();

    await page.getByRole("button", { name: "Sair" }).click();
    await page.getByLabel("Usuário ou e-mail").fill(editedEmail);
    await page.getByLabel("Senha").fill("SenhaNovaUsuario123!");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");
    await page.getByRole("button", { name: "Sair" }).click();

    await page.getByLabel("Usuário ou e-mail").fill(adminEmail);
    await page.getByLabel("Senha").fill(adminPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.goto("/admin");
    await page.getByRole("tab", { name: /Usuários/ }).click();
    await page.getByLabel("Buscar usuário").fill(`editado_${seed}`);
    const userRow = page.getByRole("article").filter({ hasText: `editado_${seed}` });
    await expect(userRow).toBeVisible();
    await userRow.getByRole("button", { name: "Editar" }).click();
    const adminModal = page.getByRole("dialog", { name: /editado_/ });
    await adminModal.getByLabel("Plano atribuído").selectOption({ label: `${planName} · 60 dias` });
    await adminModal.getByRole("button", { name: "Salvar usuário" }).click();
    await expect(page.getByRole("alertdialog", { name: "Usuário atualizado" })).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Entendi" }).click();
    await expect(userRow).toContainText(`Plano ${planName}`);
    const assignment = await pool.query<{ assigned_plan_id: string; valid_for_days: number }>(
      `select assigned_plan_id::text,
              floor(extract(epoch from (access_expires_at - now())) / 86400)::int as valid_for_days
       from users where lower(email) = lower($1)`,
      [editedEmail]
    );
    expect(assignment.rows[0].assigned_plan_id).toBe(plan.rows[0].id);
    expect(assignment.rows[0].valid_for_days).toBeGreaterThanOrEqual(59);
    await page.screenshot({ path: "/tmp/play-admin-plan-assigned.png" });
    expect(browserErrors).toEqual([]);
  } finally {
    await pool.end();
  }
});

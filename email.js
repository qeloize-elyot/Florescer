/**
 * Envio de e-mails (Gmail SMTP via senha de app)
 * Env: GMAIL_USER, GMAIL_APP_PASSWORD, SITE_URL
 */
const nodemailer = require("nodemailer");

function siteUrl() {
  return (process.env.SITE_URL || process.env.PUBLIC_URL || "https://florescer-8t6y.onrender.com").replace(/\/$/, "");
}

function mailConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function transporter() {
  if (!mailConfigured()) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendMail({ to, subject, html, text }) {
  const t = transporter();
  if (!t) {
    console.warn("[email] GMAIL_USER / GMAIL_APP_PASSWORD não configurados — e-mail não enviado para", to);
    console.warn("[email] Assunto:", subject);
    return { ok: false, motivo: "email_nao_configurado" };
  }
  try {
    await t.sendMail({
      from: `"Florescer" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: text || "",
      html
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] falha:", err.message);
    return { ok: false, motivo: err.message };
  }
}

async function enviarVerificacao(email, nome, token) {
  const link = `${siteUrl()}/?verificar=${encodeURIComponent(token)}`;
  return sendMail({
    to: email,
    subject: "Confirme seu e-mail — Florescer",
    text: `Olá, ${nome}!\n\nConfirme seu e-mail no Florescer:\n${link}\n\nSe você não criou conta, ignore este e-mail.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1E3A2F">
        <h2 style="margin:0 0 12px">Olá, ${escapeHtml(nome)}</h2>
        <p>Quase lá! Confirme seu e-mail para ativar sua conta no <strong>Florescer</strong>.</p>
        <p style="margin:28px 0">
          <a href="${link}" style="background:#1E3A2F;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
            Confirmar meu e-mail
          </a>
        </p>
        <p style="font-size:13px;color:#5a6b62">Se o botão não funcionar, copie e cole este link no navegador:<br/>
          <a href="${link}" style="color:#2A4A3A">${link}</a>
        </p>
        <p style="font-size:12px;color:#7A8A80">Se você não criou conta no Florescer, pode ignorar este e-mail.</p>
      </div>
    `
  });
}

async function enviarResetSenha(email, nome, token) {
  const link = `${siteUrl()}/?redefinir=${encodeURIComponent(token)}`;
  return sendMail({
    to: email,
    subject: "Redefinir senha — Florescer",
    text: `Olá, ${nome || ""}!\n\nRedefina sua senha no Florescer:\n${link}\n\nO link expira em 1 hora. Se você não pediu, ignore.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1E3A2F">
        <h2 style="margin:0 0 12px">Redefinir senha</h2>
        <p>Olá${nome ? `, ${escapeHtml(nome)}` : ""}! Recebemos um pedido para redefinir a senha da sua conta no <strong>Florescer</strong>.</p>
        <p style="margin:28px 0">
          <a href="${link}" style="background:#1E3A2F;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
            Criar nova senha
          </a>
        </p>
        <p style="font-size:13px;color:#5a6b62">O link expira em <strong>1 hora</strong>. Se você não pediu isso, ignore este e-mail.</p>
        <p style="font-size:12px;color:#7A8A80"><a href="${link}" style="color:#2A4A3A">${link}</a></p>
      </div>
    `
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  mailConfigured,
  siteUrl,
  enviarVerificacao,
  enviarResetSenha
};

import nodemailer from 'nodemailer';
import type { DailyDigest, UserProfile } from '@nexora/shared';
import { config } from '../config/index.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!config.email.host || !config.email.user) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
}

export async function sendDailyDigestEmail(
  user: UserProfile,
  digest: DailyDigest
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const storiesHtml = digest.topStories
    .slice(0, 5)
    .map(
      (s) =>
        `<li><a href="${s.url}" style="color:#6366f1;text-decoration:none;">${s.title}</a> — ${s.source}</li>`
    )
    .join('');

  const insightsHtml = digest.aiInsights.map((i) => `<li>${i}</li>`).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;border-radius:16px;margin-bottom:24px;">
        <h1 style="margin:0;color:white;font-size:28px;">Nexora Daily Digest</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);">${digest.date}</p>
      </div>
      <div style="background:rgba(255,255,255,0.05);padding:24px;border-radius:12px;margin-bottom:16px;">
        <h2 style="color:#a5b4fc;margin-top:0;">Executive Summary</h2>
        <p style="line-height:1.6;">${digest.executiveSummary}</p>
      </div>
      <div style="background:rgba(255,255,255,0.05);padding:24px;border-radius:12px;margin-bottom:16px;">
        <h2 style="color:#a5b4fc;margin-top:0;">Top Stories</h2>
        <ul style="line-height:1.8;">${storiesHtml}</ul>
      </div>
      <div style="background:rgba(255,255,255,0.05);padding:24px;border-radius:12px;margin-bottom:16px;">
        <h2 style="color:#a5b4fc;margin-top:0;">AI Insights</h2>
        <ul style="line-height:1.8;">${insightsHtml}</ul>
      </div>
      <p style="text-align:center;color:#64748b;font-size:12px;margin-top:32px;">
        Powered by Nexora — AI Powered Personalized News Assistant
      </p>
    </body>
    </html>
  `;

  await transport.sendMail({
    from: config.email.from,
    to: user.email,
    subject: `Your Nexora Daily Digest — ${digest.date}`,
    html,
  });

  return true;
}

export async function sendVerificationReminder(user: UserProfile): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  await transport.sendMail({
    from: config.email.from,
    to: user.email,
    subject: 'Verify your Nexora account',
    html: `<p>Hi ${user.firstName}, please verify your email to access all Nexora features.</p>`,
  });

  return true;
}

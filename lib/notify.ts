// 운영 알림 헬퍼 — silent failure 방지용
// 우선순위: 1) Resend 이메일 (RESEND_API_KEY 있으면) → 2) Webhook (ALERT_WEBHOOK_URL)
// Slack/Discord webhook 호환 (text + blocks)

export type AlertLevel = 'info' | 'warn' | 'error';

export interface AlertPayload {
  title: string;
  level: AlertLevel;
  message: string;
  context?: Record<string, unknown>;
}

const LEVEL_EMOJI: Record<AlertLevel, string> = {
  info: '🟢',
  warn: '🟡',
  error: '🔴',
};

const DEFAULT_TO_EMAIL = 'jaiwshim@gmail.com';
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev'; // Resend 기본 검증 도메인

async function sendViaResend(payload: AlertPayload): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;

  const to = process.env.ALERT_TO_EMAIL || DEFAULT_TO_EMAIL;
  const from = process.env.ALERT_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const emoji = LEVEL_EMOJI[payload.level];
  const subject = `${emoji} [GEO-AIO] ${payload.title}`;

  const contextHtml = payload.context
    ? `<pre style="background:#f3f4f6;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;">${JSON.stringify(payload.context, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</pre>`
    : '';
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;">
      <h2 style="color:${payload.level === 'error' ? '#dc2626' : payload.level === 'warn' ? '#d97706' : '#16a34a'};margin:0 0 12px;">
        ${emoji} ${payload.title}
      </h2>
      <p style="font-size:14px;line-height:1.6;color:#374151;">${payload.message}</p>
      ${contextHtml}
      <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="font-size:11px;color:#9ca3af;">GEO-AIO Alert · ${new Date().toISOString()}</p>
    </div>
  `;
  const text = `${payload.title}\n${payload.message}${
    payload.context ? '\n' + JSON.stringify(payload.context, null, 2) : ''
  }`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendViaWebhook(payload: AlertPayload): Promise<boolean> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return false;

  const emoji = LEVEL_EMOJI[payload.level];
  const contextText = payload.context
    ? '\n```\n' + JSON.stringify(payload.context, null, 2) + '\n```'
    : '';
  const text = `${emoji} *${payload.title}*\n${payload.message}${contextText}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        username: 'GEO-AIO Alert',
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text },
          },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 알림 발송 (fire-and-forget 권장).
 * 채널 우선순위: Resend 이메일 → Webhook.
 * 둘 다 미설정·실패 시 silent skip (반환값 sent=false로만 알림).
 */
export async function sendAlert(
  payload: AlertPayload
): Promise<{ sent: boolean; channel?: 'email' | 'webhook'; reason?: string }> {
  // 1순위: Resend 이메일
  if (process.env.RESEND_API_KEY) {
    const ok = await sendViaResend(payload);
    if (ok) return { sent: true, channel: 'email' };
  }
  // 2순위: Webhook
  if (process.env.ALERT_WEBHOOK_URL) {
    const ok = await sendViaWebhook(payload);
    if (ok) return { sent: true, channel: 'webhook' };
  }
  return { sent: false, reason: 'no_channel_configured_or_send_failed' };
}

/**
 * 시계열에서 z-score 기반 이상치 검출.
 * 최근 1일 값이 평균에서 ±N 표준편차 이상 벗어나면 이상치로 판정.
 */
export function detectRateAnomaly(
  series: { date: string; rate: number; measurements?: number }[],
  threshold = 2
): {
  type: 'cited_rate_outlier';
  date: string;
  rate: number;
  z_score: number;
  mean: number;
  std: number;
  severity: AlertLevel;
  message: string;
} | null {
  if (series.length < 3) return null;

  const valid = series.filter(
    (d) =>
      typeof d.rate === 'number' &&
      !Number.isNaN(d.rate) &&
      (d.measurements ?? 1) > 0
  );
  if (valid.length < 3) return null;

  const rates = valid.map((d) => d.rate);
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance =
    rates.reduce((acc, r) => acc + (r - mean) ** 2, 0) / rates.length;
  const std = Math.sqrt(variance);

  if (std === 0) return null;

  const last = valid[valid.length - 1];
  const z = (last.rate - mean) / std;

  if (Math.abs(z) < threshold) return null;

  return {
    type: 'cited_rate_outlier',
    date: last.date,
    rate: last.rate,
    z_score: Math.round(z * 100) / 100,
    mean: Math.round(mean * 10000) / 10000,
    std: Math.round(std * 10000) / 10000,
    severity: z < -threshold ? 'error' : 'warn',
    message: `${last.date} 인용률 ${(last.rate * 100).toFixed(1)}% — 평균 ${(mean * 100).toFixed(1)}% 기준 ${z >= 0 ? '+' : ''}${z.toFixed(2)}σ`,
  };
}

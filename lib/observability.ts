import { supabaseAdmin } from './supabase-admin';

type LogContext = Record<string, unknown>;
type LogLevel = 'info' | 'warn' | 'error';

export function logEvent(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...context });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.info(entry);
}

export async function reportError(event: string, error: unknown, context: LogContext = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logEvent('error', event, { message, ...context });

  // Best-effort : une panne de Supabase ne doit pas masquer l’erreur originale.
  try {
    await supabaseAdmin.from('app_logs').insert({ level: 'error', event, message, context: { ...context, stack } });
  } catch (logError) {
    logEvent('warn', 'observability.persistence_failed', { message: logError instanceof Error ? logError.message : String(logError) });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;
  if (!apiKey || !alertEmail) return;

  const from = process.env.RESEND_FROM || 'Emmaashop <contact@emmaashop.fr>';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [alertEmail], subject: `[Emmaashop] Erreur ${event}`, text: `${message}\n\n${stack ?? ''}\n\n${JSON.stringify(context)}` }),
    });
  } catch (notificationError) {
    logEvent('error', 'observability.alert_failed', { message: notificationError instanceof Error ? notificationError.message : String(notificationError) });
  }
}

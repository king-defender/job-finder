import { ConsoleNotifier, Notifier } from "./notifier";
import { SmtpNotifier } from "./smtpNotifier";

export type { Notifier } from "./notifier";
export { ConsoleNotifier } from "./notifier";
export { SmtpNotifier } from "./smtpNotifier";
export type { SmtpConfig } from "./smtpNotifier";

/** Falls back to ConsoleNotifier unless every SMTP_* env var is present — never a half-configured, silently-broken send path. */
export function createNotifier(): Notifier {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL_FROM, NOTIFY_EMAIL_TO } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && NOTIFY_EMAIL_FROM && NOTIFY_EMAIL_TO) {
    return new SmtpNotifier({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: NOTIFY_EMAIL_FROM,
      to: NOTIFY_EMAIL_TO,
    });
  }

  return new ConsoleNotifier();
}

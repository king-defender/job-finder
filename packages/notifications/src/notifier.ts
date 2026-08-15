export interface Notifier {
  notify(subject: string, body: string): Promise<void>;
}

/**
 * Default — logs clearly rather than silently doing nothing, so it's obvious
 * no real email went out unless SMTP is actually configured. Never claim to
 * have sent something that wasn't sent.
 */
export class ConsoleNotifier implements Notifier {
  async notify(subject: string, body: string): Promise<void> {
    console.log(`[notification — SMTP not configured, not actually sent]\n  Subject: ${subject}\n  ${body}`);
  }
}

import nodemailer, { Transporter } from "nodemailer";
import { Notifier } from "./notifier";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
}

/**
 * Untested against a real mail server — this environment has no SMTP
 * credentials to verify delivery against. Only used when all SMTP_* env vars
 * are present (see createNotifier); otherwise ConsoleNotifier is used instead
 * of pretending this path works.
 */
export class SmtpNotifier implements Notifier {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: { user: config.user, pass: config.pass },
    });
  }

  async notify(subject: string, body: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: this.config.to,
      subject,
      text: body,
    });
  }
}

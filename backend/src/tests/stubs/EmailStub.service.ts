import { EmailContent, EmailService } from "src/infra/email";

type Mail = { object: string; content: EmailContent };

export class EmailStubService extends EmailService {
  inbox = new Map<string, Mail[]>();

  async sendEmail(
    recipient: string,
    object: string,
    content: EmailContent
  ): Promise<void> {
    const mails = this.inbox.get(recipient);
    const mail: Mail = { object, content };

    if (mails === undefined) {
      this.inbox.set(recipient, [mail]);
    } else {
      mails.push(mail);
    }
  }
}

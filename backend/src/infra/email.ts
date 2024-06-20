import { SES, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { Injectable, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Transporter, createTransport } from "nodemailer";
import SESTransport from "nodemailer/lib/ses-transport";
import { Configuration } from "src/config";

export type EmailContent = { text: string; html?: string };

@Injectable()
export class EmailService {
  private transporter: Transporter<SESTransport.SentMessageInfo>;

  constructor(configService: ConfigService<Configuration, true>) {
    const { accessKeyId, secretAccessKey } = configService.get("email", {
      infer: true,
    });

    const ses = new SES({
      apiVersion: "2010-12-01",
      region: "eu-west-3",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    } as never);

    this.transporter = createTransport({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      SES: { ses, aws: { SendRawEmailCommand } },
      sendingRate: 1, // 1 msg per seconds
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    content: EmailContent
  ): Promise<void> {
    await this.transporter.sendMail({
      from: "no-reply@hibooks.xyz",
      to,
      subject,
      html: content.html,
      text: content.text,
    });
  }
}

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

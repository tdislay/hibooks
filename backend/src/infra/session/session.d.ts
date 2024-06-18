import { UserPasswordOmitted } from "src/modules/users/users.service";

export type SessionContent = UserPasswordOmitted;

declare module "express" {
  interface Request {
    session: SessionContent | null;
  }
}

import { UserPrivate } from "src/modules/users/types";

export type SessionContent = UserPrivate;
declare module "express" {
  interface Request {
    session: SessionContent | null;
  }
}

import { MeRequest, MeResponse, UserPrivate } from "backend";
import { cookies } from "next/headers";
import { api } from "../api";

export async function retrieveUserFromSessionIfAny(): Promise<UserPrivate | null> {
  const { result } = await api.get<MeRequest, MeResponse>(
    "/auth/me",
    undefined,
    {
      // ? We need to pass the cookies from the frontend to the backend during SSR
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Cookie: cookies().toString() },
    },
  );

  return result;
}

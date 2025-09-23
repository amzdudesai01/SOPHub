import { fetchWithAuth } from "./auth";

export type Me = {
  sub: string;
  email: string;
  role: string;
  exp: number;
};

export async function getMe(): Promise<Me> {
  const res = await fetchWithAuth("/auth/me");
  return res.json();
}



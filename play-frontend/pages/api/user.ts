// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { auth } from "../../play";
import { NextApiRequest, NextApiResponse } from "next";
import { getSessionAuthenticatedUser } from "@lib/auth";

export interface APIRequest {
  username: string;
  password: string;
}

export type APIResponse = LoggedIn | NotLoggedIn;

interface LoggedIn {
  loggedIn: true;
  user: auth.accessTokenPayload;
}

interface NotLoggedIn {
  loggedIn: false;
  user: undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ loggedIn: false, user: undefined });
  }
  const user = await getSessionAuthenticatedUser(req, res);
  if (!user) {
    const response: NotLoggedIn = { loggedIn: false, user: undefined };
    return res.status(200).json(response);
  }
  const response: LoggedIn = { loggedIn: true, user };
  return res.status(200).json(response);
}

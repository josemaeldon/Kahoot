import { NextApiRequest, NextApiResponse } from "next";
import { clearSessionCookie } from "@lib/auth";

interface APIResponse {
  error: boolean;
}

export default async function signout(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true });
  }
  clearSessionCookie(res);
  return res.status(200).json({ error: false });
}

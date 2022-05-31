import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@serverless/mongoCache";
import * as jwt from "jsonwebtoken";

export type APIResponse = Success | Fail;

interface Success {
  error: false;
}

interface Fail {
  error: true;
  errorDescription: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") res.status(401).json({});
  if (req.cookies["accessToken"]) {
    const response: Fail = { error: true, errorDescription: "No access token" };
    res.status(200).json(response);
  }
  try {
    jwt.verify(req.cookies["accessToken"], "secret", { complete: false });
  } catch (e) {}
}

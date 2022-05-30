import { NextApiRequest, NextApiResponse } from "next";
import * as cookie from "cookie";

export default async function signout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(401).json({});
  }

  res.setHeader("Set-Cookie", [
    cookie.serialize("accessToken", "", {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    }),
    cookie.serialize("loggedIn", "", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    }),
  ]);

  res.redirect("/");
}

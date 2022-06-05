import React from "react";
import styles from "@styles/signup.module.css";
import Link from "next/link";
import { useState } from "react";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "pages/api/signup";
import { useRouter } from "next/router";
import Header from "@components/Header";
import useUser from "@lib/useUser";

interface Info {
  username: string;
  password: string;
}

function Signup() {
  const [info, setInfo] = useState<Info>({ username: "", password: "" });
  const router = useRouter();
  const { loggedIn, user } = useUser();
  function signupHandler() {
    postData<APIRequest, APIResponse>("/api/signup", info).then((response) => {
      if (response.error === true) {
        //To do, user interface for error
        console.log(response.errorDescription);
      }

      //If there was no error, then
      if (response.error === false) {
        localStorage.setItem(
          "accessTokenPayload",
          JSON.stringify(response.user)
        );
        router.push("/");
      }
    });
  }
  return (
    <div className={`vh100`}>
      <Header></Header>
      <div className={`${styles.container}`}>
        <div className={`${styles.card}`}>
          <form>
            <p>Sign up</p>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={info.username}
              onChange={(e) => {
                setInfo((info) => ({ ...info, username: e.target.value }));
              }}
            ></input>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={info.password}
              onChange={(e) => {
                setInfo((info) => ({ ...info, password: e.target.value }));
              }}
            ></input>
            <p>
              {"Already have an account?"}
              <Link href="/auth/login">
                <a>Login</a>
              </Link>
            </p>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                signupHandler();
              }}
            >
              Sign up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;

import React, { useState } from "react";
import styles from "@styles/signup.module.css";
import Link from "next/link";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "pages/api/login";
import useUser from "@lib/useUser";
import { useRouter } from "next/router";
import Header from "@components/HeaderBar";
function Login() {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter();
  const { loggedIn, user } = useUser();
  if (loggedIn) {
    window.location.href = "/";
    return <></>;
  }

  function loginHandler() {
    const request: APIRequest = { username, password };
    postData<APIResponse>("/api/login", request).then((response) => {
      if (response.error === true) {
        //To do: interface for the error
        console.log(response.errorDescription);
      }

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
            <p>Log in</p>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            ></input>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            ></input>
            <p>
              {"Don't have an account?"}
              <Link href="/auth/forgotpassword">
                <a>Sign up</a>
              </Link>
            </p>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                loginHandler();
              }}
            >
              Log in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

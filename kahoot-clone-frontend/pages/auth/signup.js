import React from "react";
import Header from "../../Components/header.js";
import styles from "../../styles/signup.module.css";
import Link from "next/link";
function Signup() {
  return (
    <div className={`vh100`}>
      <Header></Header>
      <div className={`${styles.container}`}>
        <div className={`${styles.card}`}>
          <form>
            <p>Log in</p>
            <label htmlFor="username">Username or email</label>
            <input type="text" id="username"></input>
            <label htmlFor="password">Password</label>
            <input type="password" id="password"></input>
            <p>
              Forgot Password?{" "}
              <Link href="/auth/forgotpassword">
                <a>Reset your password</a>
              </Link>
            </p>
            <button type="submit">Log in</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;

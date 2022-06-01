import Questions from "@components/Questions";
import Header from "@components/Header";
import styles from "@styles/profile.module.css";
import React, { useEffect, useState } from "react";
import useUser from "@lib/useSSRUser";
import type { db } from "../kahoot";
import { postData } from "@lib/postData";
import { APIRequest, APIResponse } from "./api/getGames";

function Profile() {
  const { loggedIn, user } = useUser();
  const [data, setData] = useState<null | db.KahootGame[]>(null);

  useEffect(() => {
    if (loggedIn) {
      postData<APIRequest, APIResponse>("/api/getGames", {
        type: "userId",
        userId: user._id,
      }).then((res) => {
        if (res.error === true) {
          //Todo: error gui
        } else {
          setData(res.games);
          console.log(res.games);
        }
      });
    }
  }, [loggedIn, user._id]);

  if (!loggedIn) return <></>;

  return (
    <div className={`${styles.container}`}>
      <div className={`${styles.otherContainer}`}>
        <Header></Header>
      </div>
      <div className={`${styles.innerContainer}`}>
        <div className={`${styles.innerInnerContainer}`}>
          <div className={`${styles.kahootGrid}`}>
            {data !== null &&
              data.map((game) => {
                const date = new Date();
                date.setTime(game.date);
                return (
                  <div className={`${styles.gameElement}`} key={game._id}>
                    <p>
                      <b>{game.title}</b>
                    </p>
                    <p>
                      {game.questions.length}{" "}
                      {game.questions.length === 1 ? "Question" : "Questions"}
                    </p>
                    <p>{`Created: ${date.getMonth()}/${date.getDay()}/${date.getFullYear()}`}</p>
                    <button className={`${styles.playButton}`}>
                      Start Game
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

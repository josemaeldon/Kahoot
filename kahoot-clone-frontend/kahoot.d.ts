import { ObjectId } from "mongodb";

export namespace db {
  declare interface KahootGame {
    id: string; //uuid of the game
    author: string; //uuid of the author
    title: string;
    questions: Question[];
  }

  declare interface Question {
    question: string;
    choices: string[];
    correctAnswer: number; //index of the correct answer
    time: number; // integer
  }

  declare interface User {
    _id: string;
    username: string;
    passwordHash: string;
  }
}

export namespace auth {
  declare interface accessTokenPayload {
    _id: string;
    username: string;
  }
}

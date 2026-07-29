export namespace db {
  declare interface KahootGame {
    _id: string; //uuid of the game
    author_id: string; //uuid of the author
    author_username: string;
    title: string;
    date: number; //Time since unix epoch
    questions: Question[];
  }

  declare interface Question {
    question: string;
    image?: string | null;
    choices: string[];
    correctAnswer: number; //index of the correct answer
    time: number; // integer
  }

  declare interface User {
    _id: string;
    username: string;
    whatsapp: string;
    passwordHash: string;
  }
}

export namespace auth {
  declare interface accessTokenPayload {
    _id: string;
    username: string;
    whatsapp: string;
  }
}

export interface rustServerQuestion {
  question: string;
  image?: string | null;
  choices: string[];
  answer: number;
  time: number;
}
export namespace action {
  declare interface CreateRoom {
    type: "createRoom";
    questions: rustServerQuestion[];
  }
  declare interface JoinRoom {
    type: "joinRoom";
    roomId: number;
    username: string;
  }

  declare interface Answer {
    type: "answer";
    choice: number;
  }

  declare interface BeginRound {
    type: "beginRound";
  }
  declare interface EndRound {
    type: "endRound";
  }
}

export namespace HostEvent {
  declare type Event =
    | RoomCreated
    | RoomCreationFailed
    | UserJoined
    | UserLeft
    | UserAnswered
    | RoundBegin
    | RoundEnd
    | GameEnd;
  declare interface RoomCreated {
    type: "roomCreated";
    roomId: number;
  }
  declare interface RoomCreationFailed {
    type: "roomCreationFailed";
    reason: string;
  }

  declare interface UserJoined {
    type: "userJoined";
    username: string;
  }

  declare interface UserLeft {
    type: "userLeft";
    username: string;
  }

  declare interface UserAnswered {
    type: "userAnswered";
    username: string;
  }

  declare interface RoundBegin {
    type: "roundBegin";
    question: rustServerQuestion;
  }

  declare interface RoundEnd {
    type: "roundEnd";
    pointGains: Record<string, number>;
  }

  declare interface GameEnd {
    type: "gameEnd";
  }
}

export namespace UserEvent {
  declare type event = Joined | JoinFailed | RoundBegin | RoundEnd | GameEnd;
  declare interface Joined {
    type: "joined";
  }

  declare interface JoinFailed {
    type: "joinFailed";
    reason: string;
  }

  declare interface RoundBegin {
    type: "roundBegin";
    choices: string[];
  }

  declare interface RoundEnd {
    type: "roundEnd";
    pointGain: number | null;
  }

  declare interface GameEnd {
    type: "gameEnd";
    ranking: Array<{
      username: string;
      points: number;
    }>;
  }
}

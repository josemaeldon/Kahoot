export namespace db {
  declare interface KahootGame {
    _id: string; //uuid of the game
    author_id: string; //uuid of the author
    author_username: string;
    title: string;
    date: number; //Time since unix epoch
    isPublic: boolean;
    isDefault?: boolean;
    folderId?: string | null;
    folderName?: string | null;
    categoryId: string;
    categoryName?: string;
    questions: Question[];
  }

  declare interface KahootSummary {
    _id: string;
    author_id: string;
    author_username: string;
    title: string;
    date: number;
    questionCount: number;
    isPublic: boolean;
    isDefault: boolean;
    folderId: string | null;
    folderName: string | null;
    categoryId: string;
    categoryName: string;
  }

  declare interface KahootCategory {
    id: string;
    name: string;
    slug: string;
    isDefault: boolean;
    createdByMe: boolean;
    gameCount: number;
  }

  declare interface KahootFolder {
    id: string;
    name: string;
    gameCount: number;
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
  declare type UserRole = "user" | "superadmin";

  declare interface accessTokenPayload {
    _id: string;
    username: string;
    whatsapp: string;
    role: UserRole;
    isEnabled: boolean;
    accessExpiresAt: string | null;
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
  declare interface ResumeRoom {
    type: "resumeRoom";
    roomId: number;
    username: string;
    sessionToken: string;
  }

  declare interface Answer {
    type: "answer";
    choice: number;
  }
  declare interface LeaveRoom {
    type: "leaveRoom";
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
  declare type event =
    | Joined
    | JoinFailed
    | KeepAlive
    | RoundBegin
    | RoundEnd
    | GameEnd;
  declare interface Joined {
    type: "joined";
    sessionToken: string;
    resumed: boolean;
  }

  declare interface JoinFailed {
    type: "joinFailed";
    reason: string;
  }
  declare interface KeepAlive {
    type: "keepAlive";
  }

  declare interface RoundBegin {
    type: "roundBegin";
    choices: string[];
    totalPoints: number;
  }

  declare interface RoundEnd {
    type: "roundEnd";
    pointGain: number | null;
    totalPoints: number;
  }

  declare interface GameEnd {
    type: "gameEnd";
    ranking: Array<{
      username: string;
      points: number;
    }>;
  }
}

import { Timestamp } from "firebase/firestore";

export interface CommentDoc {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  isAnonymous: boolean;
  timestamp: Timestamp;
}

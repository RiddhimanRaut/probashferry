export interface CommentDoc {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  isAnonymous: boolean;
  timestamp: string;
  edited?: boolean;
}

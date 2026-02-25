export interface User {
  id: string;
  name: string;
  role: "QA" | "Dev" | "ScrumMaster";
  vote: number | null;
}

export interface RoomState {
  id: string;
  name: string;
  status: "voting" | "revealed";
  users: Record<string, User>;
}

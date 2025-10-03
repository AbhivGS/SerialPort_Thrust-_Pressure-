import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      fullName: string;
      role: "user" | "admin";
    };
  }
}

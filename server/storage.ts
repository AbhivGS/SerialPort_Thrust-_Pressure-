export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: "user" | "admin";
}

export interface IStorage {
  findUserByUsername(username: string): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: User[];

  constructor() {
    this.users = [
      {
        id: "1",
        username: "engineer",
        password: "thrust123",
        fullName: "Test Engineer",
        role: "user",
      },
      {
        id: "admin",
        username: "admin",
        password: "missioncontrol",
        fullName: "Mission Control",
        role: "admin",
      },
    ];
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    const lowered = username.trim().toLowerCase();
    return this.users.find((user) => user.username.toLowerCase() === lowered);
  }
}

export const storage = new MemStorage();

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { saveRecording, listRecordings, getRecording } from "./database";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const recordingSchema = z.object({
  fileName: z.string().min(1).max(128),
  points: z
    .array(
      z.object({
        timestamp: z.string(),
        thrust: z.number(),
        pressure: z.number(),
        deviceTimestamp: z.string().optional(),
      }),
    )
    .min(1, "At least one data point is required"),
});

type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  role: "user" | "admin";
};

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

function pointsToCsv(points: Array<{ timestamp: string; thrust: number; pressure: number; deviceTimestamp?: string }>) {
  const header = "Timestamp,Thrust (g),Pressure (bar)";
  const rows = points.map(({ timestamp, thrust, pressure, deviceTimestamp }) => {
    const ts = deviceTimestamp || timestamp;
    return `${ts},${thrust},${pressure}`;
  });
  return [header, ...rows].join("\n");
}

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.findUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      };

      req.session.user = sessionUser;
      return res.json({ user: sessionUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid request payload",
          issues: error.errors.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        });
      }

      return next(error);
    }
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(204).end();
    });
  });

  router.get("/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json({ user: req.session.user });
  });

  router.post("/recordings", requireAuth, (req, res, next) => {
    try {
      const parsed = recordingSchema.parse(req.body);
      const user = req.session.user!;
      if (parsed.points.length > 5000) {
        return res.status(400).json({ message: "Recording too large (max 5000 points)" });
      }

      const csv = pointsToCsv(parsed.points);
      const recordId = saveRecording(user.username, user.fullName, parsed.fileName, csv);
      res.status(201).json({ id: recordId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid recording payload",
          issues: error.errors.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  });

  router.get("/recordings", requireAdmin, (_req, res) => {
    const recordings = listRecordings().map(({ csv, ...rest }) => rest);
    res.json({ recordings });
  });

  router.get("/recordings/:id/download", requireAdmin, (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid recording id" });
    }

    const recording = getRecording(id);
    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${recording.fileName.replace(/[^a-z0-9_-]/gi, "_") || "recording"}.csv"`,
    );
    res.send(recording.csv);
  });

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", router);

  const httpServer = createServer(app);

  return httpServer;
}

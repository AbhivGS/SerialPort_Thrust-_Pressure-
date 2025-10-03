import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { createServer, type Server } from 'http';
import { z } from 'zod';
import { storage } from './storage';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.findUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const { password: _password, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid request payload',
          issues: error.errors.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        });
      }

      return next(error);
    }
  });

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', router);

  const httpServer = createServer(app);

  return httpServer;
}

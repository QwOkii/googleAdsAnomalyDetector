import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.cookies?.userId as string | undefined;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = user.id;
  next();
}

import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { getAuthUrl, getTokensFromCode } from "../services/googleAuth";

export const authRoutes = Router();

authRoutes.get("/google", (_req: Request, res: Response) => {
  const url = getAuthUrl();
  res.redirect(url);
});

authRoutes.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      console.error("[auth/callback] No code in query");
      res.redirect("http://localhost:5173?error=auth_failed");
      return;
    }

    const { accessToken, refreshToken, googleId, email } = await getTokensFromCode(code);

    const user = await prisma.user.upsert({
      where: { googleId },
      update: { accessToken, refreshToken, email },
      create: { googleId, email, accessToken, refreshToken },
    });

    res.cookie("userId", user.id, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.redirect("http://localhost:5173");
  } catch (err) {
    console.error("[auth/callback] ERROR:", err);
    res.redirect("http://localhost:5173?error=auth_failed");
  }
});

authRoutes.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = req.cookies.userId as string | undefined;
    if (!userId) {
      res.json({ user: null });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.json({ user: null });
      return;
    }

    res.json({ user: { id: user.id, email: user.email } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

authRoutes.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("userId");
  res.json({ ok: true });
});

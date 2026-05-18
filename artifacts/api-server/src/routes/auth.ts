import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken, AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.status === "inactive") {
      res.status(403).json({ error: "Account deactivated" });
      return;
    }
    const token = signToken(user.id, user.role);
    const { passwordHash: _, ...userOut } = user;
    req.log.info({ userId: user.id, role: user.role, ip: req.ip }, "User login");
    res.json({ token, user: { ...userOut, balance: Number(userOut.balance) } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, lastName, email, phone, password } = req.body as {
      name: string; lastName: string; email: string; phone: string; password: string;
    };
    if (!name || !lastName || !email || !phone || !password) {
      res.status(400).json({ error: "All fields required" });
      return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name,
      lastName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "customer",
      status: "active",
    }).returning();
    const token = signToken(user.id, user.role);
    const { passwordHash: _, ...userOut } = user;
    res.status(201).json({ token, user: { ...userOut, balance: Number(userOut.balance) } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { passwordHash: _, ...userOut } = user;
    res.json({ ...userOut, balance: Number(userOut.balance) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/change-password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "All fields required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ error: "Current password incorrect" }); return; }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, req.userId!));
    req.log.info({ userId: req.userId }, "Password changed");
    res.json({ success: true, message: "Password changed" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/change-email", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newEmail } = req.body as { currentPassword: string; newEmail: string };
    if (!currentPassword || !newEmail) {
      res.status(400).json({ error: "All fields required" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ error: "Current password incorrect" }); return; }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, newEmail.toLowerCase())).limit(1);
    if (existing && existing.id !== req.userId) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    await db.update(usersTable).set({ email: newEmail.toLowerCase() }).where(eq(usersTable.id, req.userId!));
    req.log.info({ userId: req.userId, newEmail }, "Email changed");
    res.json({ success: true, message: "Email updated", newEmail: newEmail.toLowerCase() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

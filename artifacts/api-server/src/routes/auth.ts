import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, lt, gt } from "drizzle-orm";
import { requireAuth, signToken, AuthRequest } from "../middlewares/auth";
import { sendOtpEmail } from "../lib/email";

const router = Router();
const JWT_SECRET = process.env["SESSION_SECRET"] ?? "nql-dz-secret";
const RESET_TOKEN_SECRET = (process.env["SESSION_SECRET"] ?? "nql-dz-secret") + "-reset";

// ── Rate limiters ──────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "محاولات كثيرة جداً، انتظر 15 دقيقة وحاول مجدداً" },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "محاولات إعادة ضبط كثيرة، انتظر ساعة وحاول مجدداً" },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "محاولات كثيرة جداً، انتظر قليلاً وحاول مجدداً" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Login ──────────────────────────────────────────────────────────────────────

router.post("/login", loginLimiter, async (req, res) => {
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

// ── Register ───────────────────────────────────────────────────────────────────

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

// ── Me ─────────────────────────────────────────────────────────────────────────

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

// ── Change password ────────────────────────────────────────────────────────────

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

// ── Change email ───────────────────────────────────────────────────────────────

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

// ── Forgot password ────────────────────────────────────────────────────────────

router.post("/forgot-password", forgotLimiter, async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    if (!email) {
      res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);

    // Always respond with success to prevent email enumeration attacks
    if (!user) {
      req.log.info({ email }, "Forgot password: email not found (silent)");
      res.json({ success: true, message: "إذا كان البريد مسجلاً، ستصلك رسالة قريباً" });
      return;
    }

    // Invalidate old tokens for this user
    await db.delete(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.userId, user.id));

    // Generate 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));
    const tokenHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send email (non-blocking on failure)
    try {
      await sendOtpEmail(user.email, user.name, otp);
      req.log.info({ userId: user.id, email: user.email }, "Password reset OTP sent");
    } catch (emailErr) {
      req.log.error({ emailErr }, "Failed to send OTP email");
      // Still succeed — log shows OTP in dev mode
    }

    res.json({ success: true, message: "إذا كان البريد مسجلاً، ستصلك رسالة قريباً" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Verify OTP ────────────────────────────────────────────────────────────────

router.post("/verify-reset-otp", otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };
    if (!email || !otp) {
      res.status(400).json({ error: "البريد والرمز مطلوبان" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(400).json({ error: "رمز غير صحيح أو منتهي الصلاحية" });
      return;
    }

    const now = new Date();
    const [tokenRow] = await db.select()
      .from(passwordResetTokensTable)
      .where(and(
        eq(passwordResetTokensTable.userId, user.id),
        gt(passwordResetTokensTable.expiresAt, now)
      ))
      .limit(1);

    if (!tokenRow) {
      res.status(400).json({ error: "الرمز منتهي الصلاحية أو غير موجود — اطلب رمزاً جديداً" });
      return;
    }

    // Check max attempts
    if (tokenRow.attempts >= 5) {
      await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.id, tokenRow.id));
      res.status(400).json({ error: "تجاوزت الحد الأقصى من المحاولات — اطلب رمزاً جديداً" });
      return;
    }

    // Increment attempts
    await db.update(passwordResetTokensTable)
      .set({ attempts: tokenRow.attempts + 1 })
      .where(eq(passwordResetTokensTable.id, tokenRow.id));

    const inputHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (inputHash !== tokenRow.tokenHash) {
      const remaining = 4 - tokenRow.attempts;
      res.status(400).json({ error: `رمز غير صحيح — تبقى ${remaining} محاولات` });
      return;
    }

    // OTP is valid — mark as used
    await db.update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(eq(passwordResetTokensTable.id, tokenRow.id));

    // Issue a short-lived reset JWT (10 minutes)
    const resetToken = jwt.sign(
      { userId: user.id, type: "password_reset", tokenId: tokenRow.id },
      RESET_TOKEN_SECRET,
      { expiresIn: "10m" }
    );

    req.log.info({ userId: user.id }, "Password reset OTP verified");
    res.json({ success: true, resetToken });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Reset password with token ──────────────────────────────────────────────────

router.post("/reset-password-with-token", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body as { resetToken: string; newPassword: string };
    if (!resetToken || !newPassword) {
      res.status(400).json({ error: "البيانات ناقصة" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
      return;
    }

    let payload: { userId: number; type: string; tokenId: number };
    try {
      payload = jwt.verify(resetToken, RESET_TOKEN_SECRET) as typeof payload;
    } catch {
      res.status(400).json({ error: "انتهت صلاحية الجلسة — أعد العملية من البداية" });
      return;
    }

    if (payload.type !== "password_reset") {
      res.status(400).json({ error: "رمز غير صالح" });
      return;
    }

    // Verify the token row still exists and was used (verified OTP)
    const [tokenRow] = await db.select()
      .from(passwordResetTokensTable)
      .where(and(
        eq(passwordResetTokensTable.id, payload.tokenId),
        eq(passwordResetTokensTable.userId, payload.userId)
      ))
      .limit(1);

    if (!tokenRow || !tokenRow.usedAt) {
      res.status(400).json({ error: "رمز غير صالح أو لم يتم التحقق منه" });
      return;
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, payload.userId));

    // Clean up reset token
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.id, tokenRow.id));

    req.log.info({ userId: payload.userId }, "Password reset successfully");
    res.json({ success: true, message: "تم تعيين كلمة المرور الجديدة بنجاح" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

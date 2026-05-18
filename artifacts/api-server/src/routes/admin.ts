import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, cardsTable, transactionsTable, withdrawalRequestsTable } from "@workspace/db";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth";

const router = Router();
// Both admin and sub_admin can access this router; individual routes add extra guards
router.use(requireAuth, requireRole("admin", "sub_admin"));

const isMainAdmin = (req: AuthRequest) => req.userRole === "admin";

function safeUser(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...rest } = u;
  return { ...rest, balance: Number(rest.balance) };
}

// ── Stats (main admin only) ──────────────────────────────────────────────────
router.get("/stats", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) {
    res.status(403).json({ error: "Forbidden for sub-admin" });
    return;
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [totalDrivers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "driver"));
    const [totalCustomers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "customer"));
    const [totalDistributors] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "distributor"));
    const [totalTransactions] = await db.select({ count: sql<number>`count(*)` }).from(transactionsTable);
    const [platformEarnings] = await db.select({ total: sql<number>`coalesce(sum(platform_fee), 0)` }).from(transactionsTable);
    const [pendingCards] = await db.select({ count: sql<number>`count(*)` }).from(cardsTable).where(eq(cardsTable.status, "pending"));
    const [pendingWithdrawals] = await db.select({ count: sql<number>`count(*)` }).from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.status, "pending"));
    const [todayTx] = await db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(gte(transactionsTable.createdAt, today));
    const [todayEarnings] = await db.select({ total: sql<number>`coalesce(sum(platform_fee), 0)` }).from(transactionsTable).where(gte(transactionsTable.createdAt, today));

    res.json({
      totalUsers: Number(totalUsers.count),
      totalDrivers: Number(totalDrivers.count),
      totalCustomers: Number(totalCustomers.count),
      totalDistributors: Number(totalDistributors.count),
      totalTransactions: Number(totalTransactions.count),
      totalPlatformEarnings: Number(platformEarnings.total),
      pendingCards: Number(pendingCards.count),
      pendingWithdrawals: Number(pendingWithdrawals.count),
      todayTransactions: Number(todayTx.count),
      todayEarnings: Number(todayEarnings.total),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Sub-admin lightweight stats (counts only, no financials)
router.get("/sub-stats", async (req: AuthRequest, res) => {
  try {
    const [totalDrivers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "driver"));
    const [totalDistributors] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "distributor"));
    const [totalCustomers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "customer"));
    res.json({
      totalDrivers: Number(totalDrivers.count),
      totalDistributors: Number(totalDistributors.count),
      totalCustomers: Number(totalCustomers.count),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users", async (req: AuthRequest, res) => {
  try {
    const { role } = req.query as { role?: string };
    const users = role
      ? await db.select().from(usersTable).where(eq(usersTable.role, role)).orderBy(desc(usersTable.createdAt))
      : await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json({ users: users.map(safeUser), total: users.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/users", async (req: AuthRequest, res) => {
  try {
    const { name, lastName, email, phone, password, role, licenseNumber, profileImage } = req.body as {
      name: string; lastName: string; email: string; phone: string;
      password: string; role: string; licenseNumber?: string; profileImage?: string;
    };
    // Sub-admin can only create driver or distributor
    if (!isMainAdmin(req) && !["driver", "distributor"].includes(role)) {
      res.status(403).json({ error: "Sub-admin can only create driver or distributor accounts" });
      return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing) { res.status(400).json({ error: "Email already exists" }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const initialBalance = role === "distributor" ? "10000" : "0";
    const [user] = await db.insert(usersTable).values({
      name, lastName, email: email.toLowerCase(), phone, passwordHash, role,
      licenseNumber: licenseNumber ?? null,
      profileImage: profileImage ?? null,
      balance: initialBalance,
      status: "active",
    }).returning();
    res.status(201).json(safeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/:id", async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id))).limit(1);
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json(safeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/users/:id", async (req: AuthRequest, res) => {
  try {
    const { name, lastName, email, phone, status, licenseNumber } = req.body;
    // Sub-admin cannot deactivate accounts
    if (!isMainAdmin(req) && status) {
      res.status(403).json({ error: "Sub-admin cannot change account status" });
      return;
    }
    const [user] = await db.update(usersTable).set({
      ...(name && { name }),
      ...(lastName && { lastName }),
      ...(email && { email: email.toLowerCase() }),
      ...(phone && { phone }),
      ...(status && { status }),
      ...(licenseNumber !== undefined && { licenseNumber }),
    }).where(eq(usersTable.id, Number(req.params.id))).returning();
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json(safeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset password — main admin only
router.post("/users/:id/reset-password", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) {
    res.status(403).json({ error: "Only main admin can reset passwords" });
    return;
  }
  try {
    const { newPassword } = req.body as { newPassword: string };
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, Number(req.params.id)));
    res.json({ success: true, message: "Password reset" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset balance to zero — main admin only
router.post("/users/:id/reset-balance", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) {
    res.status(403).json({ error: "Only main admin can reset balances" });
    return;
  }
  try {
    const userId = Number(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (!["driver", "distributor"].includes(user.role)) {
      res.status(400).json({ error: "Can only reset balance for drivers or distributors" });
      return;
    }
    await db.update(usersTable).set({ balance: "0" }).where(eq(usersTable.id, userId));
    res.json({ success: true, message: "Balance reset to zero" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete user — main admin only, drivers and distributors only
router.post("/users/:id/delete", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) {
    res.status(403).json({ error: "Only main admin can delete users" });
    return;
  }
  try {
    const userId = Number(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (!["driver", "distributor", "customer"].includes(user.role)) {
      res.status(400).json({ error: "Cannot delete admin accounts" });
      return;
    }
    // Delete related data first
    if (user.role === "driver") {
      await db.delete(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.driverId, userId));
    }
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Driver earnings (main admin only) ────────────────────────────────────────
router.get("/driver-earnings", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const drivers = await db.select().from(usersTable).where(eq(usersTable.role, "driver")).orderBy(desc(usersTable.createdAt));
    const result = await Promise.all(drivers.map(async (d) => {
      const trips = await db.select().from(transactionsTable)
        .where(and(eq(transactionsTable.driverId, d.id), eq(transactionsTable.type, "ride")));
      const totalEarnings = trips.reduce((s, t) => s + Number(t.driverEarning), 0);
      const totalFare = trips.reduce((s, t) => s + Number(t.amount), 0);
      const totalFees = trips.reduce((s, t) => s + Number(t.platformFee), 0);
      const withdrawals = await db.select().from(withdrawalRequestsTable)
        .where(and(eq(withdrawalRequestsTable.driverId, d.id), eq(withdrawalRequestsTable.status, "approved")));
      const totalWithdrawn = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
      return {
        id: d.id, name: d.name, lastName: d.lastName, email: d.email,
        balance: Number(d.balance), totalTrips: trips.length,
        totalEarnings, totalFare, totalFees, totalWithdrawn,
      };
    }));
    res.json({ drivers: result });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Distributor balances (both admin and sub_admin) ──────────────────────────
router.get("/distributor-balances", async (req: AuthRequest, res) => {
  try {
    const distributors = await db.select().from(usersTable)
      .where(eq(usersTable.role, "distributor")).orderBy(desc(usersTable.createdAt));
    const result = await Promise.all(distributors.map(async (d) => {
      const topups = await db.select().from(transactionsTable)
        .where(and(eq(transactionsTable.distributorId, d.id), eq(transactionsTable.type, "topup")));
      const totalTopups = topups.length;
      const totalSent = topups.reduce((s, t) => s + Number(t.amount), 0);
      const totalProfit = topups.reduce((s, t) => s + Number(t.driverEarning), 0);
      return {
        id: d.id, name: d.name, lastName: d.lastName, email: d.email,
        balance: Number(d.balance), status: d.status,
        totalTopups, totalSent, totalProfit,
      };
    }));
    res.json({ distributors: result });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Cards (main admin only) ───────────────────────────────────────────────────
router.get("/cards", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { status } = req.query as { status?: string };
    const cards = status
      ? await db.select().from(cardsTable).where(eq(cardsTable.status, status)).orderBy(desc(cardsTable.createdAt))
      : await db.select().from(cardsTable).orderBy(desc(cardsTable.createdAt));
    res.json({ cards: cards.map(c => ({ ...c, balance: Number(c.balance) })), total: cards.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cards/:id/approve", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const [card] = await db.update(cardsTable).set({ status: "active" }).where(eq(cardsTable.id, Number(req.params.id))).returning();
    if (!card) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...card, balance: Number(card.balance) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cards/:id/reject", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const [card] = await db.update(cardsTable).set({ status: "rejected" }).where(eq(cardsTable.id, Number(req.params.id))).returning();
    if (!card) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...card, balance: Number(card.balance) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Transactions (main admin only) ───────────────────────────────────────────
router.get("/transactions", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { type } = req.query as { type?: string };
    const txs = type
      ? await db.select().from(transactionsTable).where(eq(transactionsTable.type, type)).orderBy(desc(transactionsTable.createdAt)).limit(100)
      : await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(100);
    res.json({
      transactions: txs.map(t => ({ ...t, amount: Number(t.amount), platformFee: Number(t.platformFee), driverEarning: Number(t.driverEarning) })),
      total: txs.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Withdrawal requests (main admin only) ────────────────────────────────────
router.get("/withdrawal-requests", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { status } = req.query as { status?: string };
    const reqs = status
      ? await db.select().from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.status, status)).orderBy(desc(withdrawalRequestsTable.createdAt))
      : await db.select().from(withdrawalRequestsTable).orderBy(desc(withdrawalRequestsTable.createdAt));
    res.json({ requests: reqs.map(r => ({ ...r, amount: Number(r.amount) })), total: reqs.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/withdrawal-requests/:id/approve", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const [wr] = await db.select().from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.id, Number(req.params.id))).limit(1);
    if (!wr) { res.status(404).json({ error: "Not found" }); return; }
    if (wr.status !== "pending") { res.status(400).json({ error: "Already processed" }); return; }
    await db.execute(sql`UPDATE users SET balance = balance - ${wr.amount} WHERE id = ${wr.driverId}`);
    const [updated] = await db.update(withdrawalRequestsTable).set({ status: "approved" }).where(eq(withdrawalRequestsTable.id, wr.id)).returning();
    res.json({ ...updated, amount: Number(updated.amount) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/withdrawal-requests/:id/reject", async (req: AuthRequest, res) => {
  if (!isMainAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const [updated] = await db.update(withdrawalRequestsTable).set({ status: "rejected" }).where(eq(withdrawalRequestsTable.id, Number(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...updated, amount: Number(updated.amount) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Distributor topup (both admin and sub_admin) ─────────────────────────────
router.post("/distributors/:id/topup", async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body as { amount: number };
    if (!amount || amount <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }
    const [dist] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, Number(req.params.id)), eq(usersTable.role, "distributor"))).limit(1);
    if (!dist) { res.status(404).json({ error: "Distributor not found" }); return; }
    await db.execute(sql`UPDATE users SET balance = balance + ${amount} WHERE id = ${Number(req.params.id)} AND role = 'distributor'`);
    const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id))).limit(1);
    res.json({ success: true, message: `Added ${amount} DZD to distributor`, newBalance: Number(updated.balance) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

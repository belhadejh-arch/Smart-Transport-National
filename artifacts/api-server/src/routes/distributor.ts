import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, cardsTable, transactionsTable, distributorBalanceRequestsTable } from "@workspace/db";
import { eq, desc, gte, sql, and } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(requireAuth, requireRole("distributor"));

const ALLOWED_AMOUNTS = [100, 200, 500, 1000, 2000, 3000, 4000, 5000, 10000];

const PROFITS: Record<number, number> = {
  100: 5,
  200: 10,
  500: 20,
  1000: 30,
  2000: 100,
  3000: 200,
  4000: 300,
  5000: 400,
  10000: 700,
};

router.get("/dashboard", async (req: AuthRequest, res) => {
  try {
    const [distributor] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!distributor) { res.status(404).json({ error: "Not found" }); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTopups = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.distributorId, req.userId!), eq(transactionsTable.type, "topup")));

    const todayTopups = allTopups.filter(t => t.createdAt >= today);
    const todayEarnings = todayTopups.reduce((s, t) => s + Number(t.driverEarning), 0);
    const totalEarnings = allTopups.reduce((s, t) => s + Number(t.driverEarning), 0);

    const recentTransactions = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.distributorId, req.userId!), eq(transactionsTable.type, "topup")))
      .orderBy(desc(transactionsTable.createdAt)).limit(10);

    res.json({
      balance: Number(distributor.balance),
      todayTopups: todayTopups.length,
      totalTopups: allTopups.length,
      todayEarnings,
      totalEarnings,
      recentTransactions: recentTransactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        platformFee: Number(t.platformFee),
        driverEarning: Number(t.driverEarning),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/scan", async (req: AuthRequest, res) => {
  try {
    const { cardNumber, amount } = req.body as { cardNumber: string; amount: number };
    if (!cardNumber || !amount || amount <= 0) {
      res.status(400).json({ error: "Card number and amount required" });
      return;
    }
    if (!ALLOWED_AMOUNTS.includes(Number(amount))) {
      res.status(400).json({ error: `Amount must be one of: ${ALLOWED_AMOUNTS.join(", ")} DZD` });
      return;
    }

    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.cardNumber, cardNumber)).limit(1);
    if (!card) { res.status(404).json({ error: "Card not found" }); return; }
    if (card.status !== "active") { res.status(400).json({ error: "Card not active" }); return; }

    const [distributor] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!distributor || Number(distributor.balance) < amount) {
      res.status(400).json({ error: "Insufficient distributor balance" });
      return;
    }

    const profit = PROFITS[Number(amount)] ?? 0;
    const newCardBalance = Number(card.balance) + amount;
    const newDistBalance = Number(distributor.balance) - amount;

    // Atomic transaction — both updates succeed or both fail
    await db.transaction(async (tx) => {
      await tx.execute(sql`UPDATE users SET balance = ${newDistBalance} WHERE id = ${req.userId!}`);
      await tx.execute(sql`UPDATE cards SET balance = ${newCardBalance} WHERE id = ${card.id}`);
      await tx.insert(transactionsTable).values({
        cardId: card.id,
        distributorId: req.userId!,
        amount: String(amount),
        platformFee: "0",
        driverEarning: String(profit),
        type: "topup",
        cardType: card.type,
      });
    });

    res.json({
      success: true,
      cardType: card.type,
      amount,
      profit,
      cardBalance: newCardBalance,
      distributorBalance: newDistBalance,
      message: `${amount} DZD added to card. Your profit: ${profit} DZD`,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/transactions", async (req: AuthRequest, res) => {
  try {
    const txs = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.distributorId, req.userId!), eq(transactionsTable.type, "topup")))
      .orderBy(desc(transactionsTable.createdAt)).limit(100);
    const totalEarnings = txs.reduce((s, t) => s + Number(t.driverEarning), 0);
    res.json({
      transactions: txs.map(t => ({
        ...t,
        amount: Number(t.amount),
        platformFee: Number(t.platformFee),
        profit: Number(t.driverEarning),
      })),
      total: txs.length,
      totalEarnings,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Balance requests ─────────────────────────────────────────────────────────

router.post("/balance-request", async (req: AuthRequest, res) => {
  try {
    const { amount, phone } = req.body as { amount: number; phone: string };
    if (!amount || amount <= 0) {
      res.status(400).json({ error: "المبلغ يجب أن يكون أكبر من صفر" });
      return;
    }
    if (!phone?.trim()) {
      res.status(400).json({ error: "رقم الهاتف مطلوب" });
      return;
    }

    const [dist] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!dist) { res.status(404).json({ error: "Not found" }); return; }

    if (Number(dist.balance) > 0) {
      res.status(400).json({ error: `لا يمكنك طلب رصيد جديد قبل استنفاد رصيدك الحالي (${Number(dist.balance).toLocaleString()} دج متبقية)` });
      return;
    }

    const [existing] = await db
      .select()
      .from(distributorBalanceRequestsTable)
      .where(and(
        eq(distributorBalanceRequestsTable.distributorId, req.userId!),
        eq(distributorBalanceRequestsTable.status, "pending")
      ))
      .limit(1);

    if (existing) {
      res.status(400).json({ error: "لديك طلب رصيد قيد الانتظار بالفعل. يرجى الانتظار حتى تتم معالجته." });
      return;
    }

    const [request] = await db.insert(distributorBalanceRequestsTable).values({
      distributorId: req.userId!,
      amount: String(amount),
      phone: phone.trim(),
      status: "pending",
    }).returning();

    req.log.info({ distributorId: req.userId, amount, requestId: request.id }, "Balance request created");
    res.status(201).json({ ...request, amount: Number(request.amount) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/balance-requests", async (req: AuthRequest, res) => {
  try {
    const requests = await db
      .select()
      .from(distributorBalanceRequestsTable)
      .where(eq(distributorBalanceRequestsTable.distributorId, req.userId!))
      .orderBy(desc(distributorBalanceRequestsTable.createdAt));

    res.json({
      requests: requests.map(r => ({ ...r, amount: Number(r.amount) })),
      total: requests.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

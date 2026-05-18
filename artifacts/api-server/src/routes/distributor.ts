import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, cardsTable, transactionsTable } from "@workspace/db";
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

    // Deduct full amount from distributor balance
    await db.execute(sql`UPDATE users SET balance = balance - ${amount} WHERE id = ${req.userId!}`);
    // Add full amount to customer card
    await db.execute(sql`UPDATE cards SET balance = balance + ${amount} WHERE id = ${card.id}`);

    // Record transaction — profit stored in driverEarning field
    await db.insert(transactionsTable).values({
      cardId: card.id,
      distributorId: req.userId!,
      amount: String(amount),
      platformFee: "0",
      driverEarning: String(profit),
      type: "topup",
      cardType: card.type,
    });

    const [updatedCard] = await db.select().from(cardsTable).where(eq(cardsTable.id, card.id)).limit(1);
    const [updatedDist] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

    res.json({
      success: true,
      cardType: card.type,
      amount,
      profit,
      cardBalance: Number(updatedCard.balance),
      distributorBalance: Number(updatedDist.balance),
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

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, cardsTable, transactionsTable } from "@workspace/db";
import { eq, desc, gte, sql, and } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(requireAuth, requireRole("distributor"));

router.get("/dashboard", async (req: AuthRequest, res) => {
  try {
    const [distributor] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!distributor) { res.status(404).json({ error: "Not found" }); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTopups = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.distributorId, req.userId!), eq(transactionsTable.type, "topup")));
    const todayTopups = allTopups.filter(t => t.createdAt >= today);
    const recentTransactions = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.distributorId, req.userId!), eq(transactionsTable.type, "topup")))
      .orderBy(desc(transactionsTable.createdAt)).limit(10);

    res.json({
      balance: Number(distributor.balance),
      todayTopups: todayTopups.length,
      totalTopups: allTopups.length,
      recentTransactions: recentTransactions.map(t => ({ ...t, amount: Number(t.amount), platformFee: Number(t.platformFee), driverEarning: Number(t.driverEarning) })),
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
    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.cardNumber, cardNumber)).limit(1);
    if (!card) { res.status(400).json({ error: "Card not found" }); return; }
    if (card.status !== "active") { res.status(400).json({ error: "Card not active" }); return; }

    const [distributor] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!distributor || Number(distributor.balance) < amount) {
      res.status(400).json({ error: "Insufficient distributor balance" });
      return;
    }

    // Deduct from distributor, add to card
    await db.execute(sql`UPDATE users SET balance = balance - ${amount} WHERE id = ${req.userId!}`);
    await db.execute(sql`UPDATE cards SET balance = balance + ${amount} WHERE id = ${card.id}`);

    await db.insert(transactionsTable).values({
      cardId: card.id,
      distributorId: req.userId!,
      amount: String(amount),
      platformFee: "0",
      driverEarning: "0",
      type: "topup",
      cardType: card.type,
    });

    const [updatedCard] = await db.select().from(cardsTable).where(eq(cardsTable.id, card.id)).limit(1);

    res.json({
      success: true,
      cardType: card.type,
      fareAmount: amount,
      platformFee: 0,
      driverEarning: 0,
      cardBalance: Number(updatedCard.balance),
      message: `${amount} DZD added to card successfully`,
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
    res.json({
      transactions: txs.map(t => ({ ...t, amount: Number(t.amount), platformFee: Number(t.platformFee), driverEarning: Number(t.driverEarning) })),
      total: txs.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

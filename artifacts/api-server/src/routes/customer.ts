import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, cardsTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(requireAuth, requireRole("customer"));

function generateCardNumber(): string {
  let num = "";
  for (let i = 0; i < 10; i++) num += Math.floor(Math.random() * 10).toString();
  return num;
}

router.get("/cards", async (req: AuthRequest, res) => {
  try {
    const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, req.userId!)).orderBy(desc(cardsTable.createdAt));
    res.json({ cards: cards.map(c => ({ ...c, balance: Number(c.balance) })), total: cards.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cards", async (req: AuthRequest, res) => {
  try {
    const { type, studentId, documentUrl, holderName, holderLastName, nationalId, schoolCertUrl, workCardUrl, disabilityCertUrl } = req.body as {
      type: string; studentId?: string; documentUrl?: string;
      holderName?: string; holderLastName?: string; nationalId?: string;
      schoolCertUrl?: string; workCardUrl?: string; disabilityCertUrl?: string;
    };
    if (!type) { res.status(400).json({ error: "Card type required" }); return; }

    let cardNumber = generateCardNumber();
    // Ensure unique
    let attempts = 0;
    while (attempts < 10) {
      const [existing] = await db.select().from(cardsTable).where(eq(cardsTable.cardNumber, cardNumber)).limit(1);
      if (!existing) break;
      cardNumber = generateCardNumber();
      attempts++;
    }

    const status = type === "standard" ? "active" : "pending";
    const [card] = await db.insert(cardsTable).values({
      userId: req.userId!,
      type,
      cardNumber,
      balance: "0",
      status,
      studentId: studentId ?? null,
      documentUrl: documentUrl ?? null,
      holderName: holderName ?? null,
      holderLastName: holderLastName ?? null,
      nationalId: nationalId ?? null,
      schoolCertUrl: schoolCertUrl ?? null,
      workCardUrl: workCardUrl ?? null,
      disabilityCertUrl: disabilityCertUrl ?? null,
    }).returning();
    res.status(201).json({ ...card, balance: Number(card.balance) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/transactions", async (req: AuthRequest, res) => {
  try {
    const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, req.userId!));
    const cardIds = cards.map(c => c.id);
    if (cardIds.length === 0) {
      res.json({ transactions: [], total: 0 });
      return;
    }
    const txs = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.cardId, cardIds[0]))
      .orderBy(desc(transactionsTable.createdAt)).limit(50);
    res.json({
      transactions: txs.map(t => ({ ...t, amount: Number(t.amount), platformFee: Number(t.platformFee), driverEarning: Number(t.driverEarning) })),
      total: txs.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/profile", async (req: AuthRequest, res) => {
  try {
    const { profileImage } = req.body as { profileImage: string };
    const [user] = await db.update(usersTable).set({ profileImage }).where(eq(usersTable.id, req.userId!)).returning();
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    const { passwordHash: _, ...userOut } = user;
    res.json({ ...userOut, balance: Number(userOut.balance) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

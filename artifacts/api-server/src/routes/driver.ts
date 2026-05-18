import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, cardsTable, transactionsTable, withdrawalRequestsTable } from "@workspace/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(requireAuth, requireRole("driver"));

const PLATFORM_FEE = 5;
const FARES: Record<string, number> = {
  standard: 50,
  student: 35,
  employee: 40,
  special_needs: 40,
};

router.get("/dashboard", async (req: AuthRequest, res) => {
  try {
    const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!driver) { res.status(404).json({ error: "Not found" }); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTrips = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.driverId, req.userId!), eq(transactionsTable.type, "ride"), gte(transactionsTable.createdAt, today)));

    const [totalTripsRow] = await db.select({ count: sql<number>`count(*)` }).from(transactionsTable)
      .where(and(eq(transactionsTable.driverId, req.userId!), eq(transactionsTable.type, "ride")));

    const recentTrips = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.driverId, req.userId!), eq(transactionsTable.type, "ride")))
      .orderBy(desc(transactionsTable.createdAt)).limit(10);

    const todayEarnings = todayTrips.reduce((s, t) => s + Number(t.driverEarning), 0);
    const platformFeeToday = todayTrips.reduce((s, t) => s + Number(t.platformFee), 0);

    res.json({
      balance: Number(driver.balance),
      todayPassengers: todayTrips.length,
      todayEarnings,
      platformFeeToday,
      totalTrips: Number(totalTripsRow.count),
      recentTrips: recentTrips.map(t => ({ ...t, amount: Number(t.amount), platformFee: Number(t.platformFee), driverEarning: Number(t.driverEarning) })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/scan", async (req: AuthRequest, res) => {
  try {
    const { cardNumber } = req.body as { cardNumber: string };
    if (!cardNumber) { res.status(400).json({ error: "Card number required" }); return; }

    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.cardNumber, cardNumber)).limit(1);
    if (!card) { res.status(400).json({ error: "Card not found" }); return; }
    if (card.status !== "active") { res.status(400).json({ error: "Card not active" }); return; }

    const fare = FARES[card.type] ?? 50;
    const platformFee = PLATFORM_FEE;
    const driverEarning = fare - platformFee;

    const cardBalance = Number(card.balance);
    if (cardBalance < fare) {
      res.status(400).json({ error: "Insufficient balance", message: `Insufficient balance. Card has ${cardBalance} DZD, fare is ${fare} DZD` });
      return;
    }

    const newCardBalance = cardBalance - fare;
    const [driver] = await db.select({ balance: usersTable.balance }).from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    const newDriverBalance = Number(driver?.balance ?? 0) + driverEarning;

    // Atomic transaction — card deduction and driver credit succeed or fail together
    await db.transaction(async (tx) => {
      await tx.execute(sql`UPDATE cards SET balance = ${newCardBalance} WHERE id = ${card.id}`);
      await tx.execute(sql`UPDATE users SET balance = ${newDriverBalance} WHERE id = ${req.userId!}`);
      await tx.insert(transactionsTable).values({
        cardId: card.id,
        driverId: req.userId!,
        amount: String(fare),
        platformFee: String(platformFee),
        driverEarning: String(driverEarning),
        type: "ride",
        cardType: card.type,
      });
    });

    res.json({
      success: true,
      cardType: card.type,
      fareAmount: fare,
      platformFee,
      driverEarning,
      cardBalance: cardBalance - fare,
      message: `Fare of ${fare} DZD deducted successfully`,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/trips", async (req: AuthRequest, res) => {
  try {
    const { date } = req.query as { date?: string };
    let query = db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.driverId, req.userId!), eq(transactionsTable.type, "ride")));

    const trips = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.driverId, req.userId!), eq(transactionsTable.type, "ride")))
      .orderBy(desc(transactionsTable.createdAt)).limit(100);

    const filtered = date
      ? trips.filter(t => t.createdAt.toISOString().startsWith(date))
      : trips;

    const totalEarnings = filtered.reduce((s, t) => s + Number(t.driverEarning), 0);
    res.json({
      trips: filtered.map(t => ({ ...t, amount: Number(t.amount), platformFee: Number(t.platformFee), driverEarning: Number(t.driverEarning) })),
      total: filtered.length,
      totalEarnings,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/report/daily", async (req: AuthRequest, res) => {
  try {
    const dateStr = (req.query.date as string) ?? new Date().toISOString().split("T")[0];
    const trips = await db.select().from(transactionsTable)
      .where(and(eq(transactionsTable.driverId, req.userId!), eq(transactionsTable.type, "ride")))
      .orderBy(desc(transactionsTable.createdAt)).limit(200);

    const filtered = trips.filter(t => t.createdAt.toISOString().startsWith(dateStr));
    const totalEarnings = filtered.reduce((s, t) => s + Number(t.driverEarning), 0);
    const platformFee = filtered.reduce((s, t) => s + Number(t.platformFee), 0);

    res.json({
      date: dateStr,
      totalTrips: filtered.length,
      totalEarnings,
      platformFee,
      passengers: filtered.length,
      trips: filtered.map(t => ({ ...t, amount: Number(t.amount), platformFee: Number(t.platformFee), driverEarning: Number(t.driverEarning) })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/withdraw", async (req: AuthRequest, res) => {
  try {
    const { amount, method, phone, ccpAccount, holderName, holderLastName } = req.body as {
      amount: number; method: string; phone?: string; ccpAccount?: string;
      holderName: string; holderLastName: string;
    };
    if (!amount || amount < 5000) {
      res.status(400).json({ error: "Minimum withdrawal is 5000 DZD" });
      return;
    }
    const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!driver || Number(driver.balance) < amount) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }
    const [wr] = await db.insert(withdrawalRequestsTable).values({
      driverId: req.userId!,
      amount: String(amount),
      method,
      phone: phone ?? null,
      ccpAccount: ccpAccount ?? null,
      holderName,
      holderLastName,
      status: "pending",
    }).returning();
    res.status(201).json({ ...wr, amount: Number(wr.amount) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/withdrawals", async (req: AuthRequest, res) => {
  try {
    const reqs = await db.select().from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.driverId, req.userId!))
      .orderBy(desc(withdrawalRequestsTable.createdAt));
    res.json({ requests: reqs.map(r => ({ ...r, amount: Number(r.amount) })), total: reqs.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

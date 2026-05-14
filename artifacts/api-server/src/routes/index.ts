import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import driverRouter from "./driver";
import customerRouter from "./customer";
import distributorRouter from "./distributor";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Seed admin user on startup
async function seedAdmin() {
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
    if (!existing) {
      const passwordHash = await bcrypt.hash("Admin@1234", 10);
      await db.insert(usersTable).values({
        name: "Admin",
        lastName: "NQL",
        email: "admin@nqldz.com",
        phone: "0000000000",
        passwordHash,
        role: "admin",
        status: "active",
        balance: "0",
      });
      logger.info("Default admin created: admin@nqldz.com / Admin@1234");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin");
  }
}
seedAdmin();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/driver", driverRouter);
router.use("/customer", customerRouter);
router.use("/distributor", distributorRouter);

export default router;

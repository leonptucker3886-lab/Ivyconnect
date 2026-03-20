import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { activatePremium, getCoupleByUserId, getDb } from "./db";
import { stripeOrders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const sig = req.headers["stripe-signature"] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return res.status(400).send("Webhook signature verification failed");
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata?.user_id || session.client_reference_id || "0");
        if (userId) {
          const db = await getDb();
          if (db) {
            // Save order record
            await db.insert(stripeOrders).values({
              userId,
              stripeSessionId: session.id,
              stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
              status: "completed",
            });
          }
          // Activate premium
          const couple = await getCoupleByUserId(userId);
          const coupleId = couple?.id || 0;
          await activatePremium(userId, coupleId);
          console.log(`[Stripe] Premium activated for user ${userId}`);
        }
      }

      res.json({ received: true });
    }
  );
}

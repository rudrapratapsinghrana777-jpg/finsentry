import { describe, expect, it } from "vitest";

import { evaluatePurchase, SAVINGS_GOAL, SPEND_LIMIT, TOTAL_BUDGET } from "@/lib/budget-rules";

describe("monthly budget rules", () => {
  it("sets a ₹30,000 budget, ₹20,000 spending cap, and ₹10,000 protected reserve", () => {
    expect(TOTAL_BUDGET).toBe(30_000);
    expect(SPEND_LIMIT).toBe(20_000);
    expect(SAVINGS_GOAL).toBe(10_000);
  });

  it("approves a non-essential purchase that stays below the ₹20,000 cap", () => {
    expect(evaluatePurchase({ currentSpend: 10_000, amount: 2_500, category: "food" }).approved).toBe(
      true,
    );
  });

  it("blocks a non-essential purchase that would cross the ₹20,000 cap", () => {
    const decision = evaluatePurchase({
      currentSpend: 19_000,
      amount: 1_001,
      category: "impulse",
    });

    expect(decision.approved).toBe(false);
    expect(decision.reason).toContain("₹1");
    expect(decision.reason).toContain("₹10,000");
  });

  it("allows an essential purchase through the cap override", () => {
    expect(
      evaluatePurchase({ currentSpend: 19_000, amount: 2_000, category: "essential" }).approved,
    ).toBe(true);
  });

  it("warns when an approved purchase leaves ₹3,000 or less under the cap", () => {
    const decision = evaluatePurchase({ currentSpend: 15_000, amount: 2_000, category: "food" });

    expect(decision.approved).toBe(true);
    expect(decision.reason).toContain("₹3,000 remains");
  });

  it("rejects zero or invalid amounts", () => {
    expect(evaluatePurchase({ currentSpend: 0, amount: 0, category: "essential" }).approved).toBe(
      false,
    );
    expect(
      evaluatePurchase({ currentSpend: 0, amount: Number.NaN, category: "food" }).approved,
    ).toBe(false);
  });
});
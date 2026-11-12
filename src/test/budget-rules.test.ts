import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  convertInrToUsd,
  DEMO_INR_PER_USD,
  evaluatePurchase,
  SAVINGS_GOAL,
  spendByCategory,
  spendingCap,
  SPEND_LIMIT,
  TOTAL_BUDGET,
  validateSettings,
} from "@/lib/budget-rules";

describe("monthly budget rules", () => {
  it("keeps budget amounts in INR and converts PayPal checkout at ₹83 per USD", () => {
    expect(DEMO_INR_PER_USD).toBe(83);
    expect(convertInrToUsd(83)).toBe("1.00");
    expect(convertInrToUsd(250)).toBe("3.01");
  });

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

  it("uses a custom budget: ₹50,000 with ₹15,000 reserve gives a ₹35,000 cap", () => {
    const settings = { ...DEFAULT_SETTINGS, totalBudget: 50_000, savingsReserve: 15_000 };
    expect(spendingCap(settings)).toBe(35_000);
    expect(evaluatePurchase({ currentSpend: 30_000, amount: 4_000, category: "food", settings }).approved).toBe(true);
    expect(evaluatePurchase({ currentSpend: 30_000, amount: 5_001, category: "food", settings }).approved).toBe(false);
  });

  it("blocks a purchase that crosses its category limit", () => {
    const settings = { ...DEFAULT_SETTINGS, categoryLimits: { impulse: 5_000 } };
    const decision = evaluatePurchase({ currentSpend: 0, amount: 2_000, category: "impulse", settings, categorySpend: 4_000 });
    expect(decision.approved).toBe(false);
    expect(decision.reason).toContain("₹5,000 category limit");
  });

  it("blocks essentials over the cap when the override is turned off", () => {
    const settings = { ...DEFAULT_SETTINGS, essentialOverride: false };
    expect(evaluatePurchase({ currentSpend: 19_000, amount: 2_000, category: "essential", settings }).approved).toBe(false);
  });

  it("rejects a savings reserve equal to or above the budget", () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, totalBudget: 10_000, savingsReserve: 10_000 })).not.toBeNull();
    expect(validateSettings(DEFAULT_SETTINGS)).toBeNull();
  });

  it("totals spend per category", () => {
    expect(spendByCategory([
      { amount: 100, category: "food" },
      { amount: 50, category: "food" },
      { amount: 70, category: "essential" },
    ])).toEqual({ essential: 70, impulse: 0, food: 150, entertainment: 0 });
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
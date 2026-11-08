export const TOTAL_BUDGET = 30_000;
export const SPEND_LIMIT = 20_000;
export const SAVINGS_GOAL = TOTAL_BUDGET - SPEND_LIMIT;

export type PurchaseCategory = "essential" | "impulse" | "food" | "entertainment";

export const PURCHASE_CATEGORIES: PurchaseCategory[] = ["essential", "impulse", "food", "entertainment"];

export interface BudgetSettings {
  totalBudget: number;
  savingsReserve: number;
  /** Optional monthly cap per category; missing or 0 means no category cap. */
  categoryLimits: Partial<Record<PurchaseCategory, number>>;
  essentialOverride: boolean;
}

export const DEFAULT_SETTINGS: BudgetSettings = {
  totalBudget: TOTAL_BUDGET,
  savingsReserve: SAVINGS_GOAL,
  categoryLimits: {},
  essentialOverride: true,
};

export function spendingCap(settings: BudgetSettings): number {
  return Math.max(0, settings.totalBudget - settings.savingsReserve);
}

/** Returns an error message, or null when the settings are valid. */
export function validateSettings(settings: BudgetSettings): string | null {
  const { totalBudget, savingsReserve, categoryLimits } = settings;
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) return "Monthly budget must be greater than zero.";
  if (!Number.isFinite(savingsReserve) || savingsReserve < 0) return "Savings reserve cannot be negative.";
  if (savingsReserve >= totalBudget) return "Savings reserve must be less than the monthly budget.";
  for (const value of Object.values(categoryLimits)) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) return "Category limits cannot be negative.";
  }
  return null;
}

export function spendByCategory(
  purchases: { amount: number; category: PurchaseCategory }[],
): Record<PurchaseCategory, number> {
  const totals: Record<PurchaseCategory, number> = { essential: 0, impulse: 0, food: 0, entertainment: 0 };
  for (const p of purchases) totals[p.category] += p.amount;
  return totals;
}

export interface BudgetDecisionInput {
  currentSpend: number;
  amount: number;
  category: PurchaseCategory;
  settings?: BudgetSettings;
  /** Approved spend so far in this purchase's category. */
  categorySpend?: number;
}

export interface BudgetDecision {
  approved: boolean;
  reason: string;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function evaluatePurchase({
  currentSpend,
  amount,
  category,
  settings = DEFAULT_SETTINGS,
  categorySpend = 0,
}: BudgetDecisionInput): BudgetDecision {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { approved: false, reason: "Enter an amount greater than zero." };
  }

  const cap = spendingCap(settings);
  const projectedSpend = currentSpend + amount;
  const remainingAfterPurchase = cap - projectedSpend;
  const overridable = category === "essential" && settings.essentialOverride;

  const categoryLimit = settings.categoryLimits[category];
  if (categoryLimit && categorySpend + amount > categoryLimit && !overridable) {
    return {
      approved: false,
      reason: `Blocked: this would exceed your ${inr(categoryLimit)} category limit by ${inr(categorySpend + amount - categoryLimit)}.`,
    };
  }

  if (overridable && projectedSpend > cap) {
    return {
      approved: true,
      reason: "Essential purchase approved by the override. This demo does not process a payment.",
    };
  }

  if (projectedSpend > cap) {
    return {
      approved: false,
      reason: `Blocked: this would exceed the spending cap by ${inr(projectedSpend - cap)}. Your ${inr(settings.savingsReserve)} savings reserve stays protected.`,
    };
  }

  if (remainingAfterPurchase <= 3_000) {
    return {
      approved: true,
      reason: `Approved with a heads-up: ${inr(remainingAfterPurchase)} remains before the spending cap.`,
    };
  }

  return {
    approved: true,
    reason: "Approved: this purchase stays within your monthly spending cap.",
  };
}

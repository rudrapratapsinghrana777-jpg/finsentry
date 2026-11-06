export const TOTAL_BUDGET = 30_000;
export const SPEND_LIMIT = 20_000;
export const SAVINGS_GOAL = TOTAL_BUDGET - SPEND_LIMIT;

export type PurchaseCategory = "essential" | "impulse" | "food" | "entertainment";

export interface BudgetDecisionInput {
  currentSpend: number;
  amount: number;
  category: PurchaseCategory;
}

export interface BudgetDecision {
  approved: boolean;
  reason: string;
}

export function evaluatePurchase({ currentSpend, amount, category }: BudgetDecisionInput): BudgetDecision {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { approved: false, reason: "Enter an amount greater than zero." };
  }

  const projectedSpend = currentSpend + amount;
  const remainingAfterPurchase = SPEND_LIMIT - projectedSpend;

  if (category === "essential" && projectedSpend > SPEND_LIMIT) {
    return {
      approved: true,
      reason: "Essential purchase approved by the override. This demo does not process a payment.",
    };
  }

  if (projectedSpend > SPEND_LIMIT) {
    const overage = projectedSpend - SPEND_LIMIT;
    return {
      approved: false,
      reason: `Blocked: this would exceed the spending cap by ₹${overage.toLocaleString("en-IN")}. Your ₹${SAVINGS_GOAL.toLocaleString("en-IN")} savings reserve stays protected.`,
    };
  }

  if (remainingAfterPurchase <= 3_000) {
    return {
      approved: true,
      reason: `Approved with a heads-up: ₹${remainingAfterPurchase.toLocaleString("en-IN")} remains before the spending cap.`,
    };
  }

  return {
    approved: true,
    reason: "Approved: this purchase stays within your monthly spending cap.",
  };
}
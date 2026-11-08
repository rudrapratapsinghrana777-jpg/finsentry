import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  CreditCard,
  IndianRupee,
  LockKeyhole,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  evaluatePurchase,
  SAVINGS_GOAL,
  SPEND_LIMIT,
  TOTAL_BUDGET,
  type PurchaseCategory,
} from "@/lib/budget-rules";

type Transaction = {
  id: string;
  itemName: string;
  amount: number;
  category: PurchaseCategory;
  status: "APPROVED" | "REJECTED";
  reason: string;
  date: string;
  justification?: string;
};

type Filter = "all" | "approved" | "blocked";

const startingTransactions: Transaction[] = [
  {
    id: "DEMO-1042",
    itemName: "Monthly groceries",
    amount: 5_450,
    category: "essential",
    status: "APPROVED",
    reason: "Approved: this purchase stays within your monthly spending cap.",
    date: "Today · 10:42 AM",
  },
  {
    id: "DEMO-1038",
    itemName: "Pharmacy essentials",
    amount: 1_850,
    category: "essential",
    status: "APPROVED",
    reason: "Approved: this purchase stays within your monthly spending cap.",
    date: "Today · 9:16 AM",
  },
  {
    id: "DEMO-1031",
    itemName: "Dinner out",
    amount: 2_700,
    category: "food",
    status: "APPROVED",
    reason: "Approved: this purchase stays within your monthly spending cap.",
    date: "Yesterday · 8:28 PM",
  },
  {
    id: "DEMO-1024",
    itemName: "New headphones",
    amount: 11_500,
    category: "impulse",
    status: "REJECTED",
    reason: "Blocked: this would exceed the spending cap by ₹1,500. Your ₹10,000 savings reserve stays protected.",
    date: "Yesterday · 3:05 PM",
  },
];

const categoryLabels: Record<PurchaseCategory, string> = {
  essential: "Essentials",
  impulse: "Extra expensive",
  food: "Food & dining",
  entertainment: "Entertainment",
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpendGuard — A smarter way to spend" },
      {
        name: "description",
        content:
          "See how PayPal-powered spending guardrails protect your monthly budget and savings with clear, transparent purchase decisions.",
      },
      { property: "og:title", content: "SpendGuard — A smarter way to spend" },
      {
        property: "og:description",
        content: "A transparent spending guard for your monthly budget and protected savings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SpendGuard,
});

function SpendGuard() {
  const [transactions, setTransactions] = useState(startingTransactions);
  const [view, setView] = useState<"overview" | "purchase">("overview");
  const [filter, setFilter] = useState<Filter>("all");
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<PurchaseCategory>("impulse");
  const [justification, setJustification] = useState("");
  const [notice, setNotice] = useState("");

  const totalSpent = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.status === "APPROVED")
        .reduce((total, transaction) => total + transaction.amount, 0),
    [transactions],
  );
  const remaining = Math.max(0, SPEND_LIMIT - totalSpent);
  const utilization = Math.min(100, (totalSpent / SPEND_LIMIT) * 100);
  const visibleTransactions = transactions.filter((transaction) => {
    if (filter === "approved") return transaction.status === "APPROVED";
    if (filter === "blocked") return transaction.status === "REJECTED";
    return true;
  });

  const resetDemo = () => {
    setTransactions(startingTransactions);
    setFilter("all");
    setView("overview");
    setNotice("Sample activity restored.");
  };

  const submitPurchase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!itemName.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    const decision = evaluatePurchase({
      currentSpend: totalSpent,
      amount: parsedAmount,
      category,
    });
    const transaction: Transaction = {
      id: `DEMO-${Date.now().toString().slice(-6)}`,
      itemName: itemName.trim(),
      amount: parsedAmount,
      category,
      status: decision.approved ? "APPROVED" : "REJECTED",
      reason: decision.reason,
      date: new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
      ...(justification.trim() ? { justification: justification.trim() } : {}),
    };

    setTransactions((current) => [transaction, ...current]);
    setFilter("all");
    setItemName("");
    setAmount("");
    setCategory("impulse");
    setJustification("");
    setNotice(decision.approved ? "Purchase approved by the demo rules." : "Purchase blocked by the demo rules.");
    setView("overview");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <a href="#overview" onClick={() => setView("overview")} className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="block text-base font-bold">SpendGuard</span>
              <span className="block text-xs text-muted-foreground">PayPal commerce concept</span>
            </span>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <Button
              variant={view === "overview" ? "secondary" : "ghost"}
              onClick={() => setView("overview")}
            >
              Overview
            </Button>
            <Button
              variant={view === "purchase" ? "default" : "outline"}
              onClick={() => {
                setNotice("");
                setView("purchase");
              }}
            >
              <Plus aria-hidden="true" />
              <span className="hidden sm:inline">Test a purchase</span>
              <span className="sm:hidden">Test</span>
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-12 pt-8 md:px-8 md:pt-10">
        <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles aria-hidden="true" className="size-4" />
              <span>Your monthly money plan</span>
            </div>
            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
              Spend with a safety net.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Keep everyday spending on track while your savings stay protected.
            </p>
          </div>
          <Button variant="outline" onClick={resetDemo} className="self-start sm:self-auto">
            <RotateCcw aria-hidden="true" /> Reset demo
          </Button>
        </section>

        <div className="mb-6 flex items-start gap-3 border-y border-warning/30 bg-warning-soft px-4 py-3 text-sm text-foreground">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            <span className="font-semibold">Demo mode.</span> Decisions use transparent sample rules;
            no PayPal payment is initiated or money moved.
          </p>
        </div>

        {notice && (
          <div role="status" className="mb-5 flex items-center justify-between gap-4 border-l-4 border-primary bg-success-soft px-4 py-3 text-sm">
            <span>{notice}</span>
            <Button variant="ghost" size="icon" aria-label="Dismiss message" onClick={() => setNotice("")}>
              <X aria-hidden="true" />
            </Button>
          </div>
        )}

        {view === "purchase" ? (
          <PurchaseForm
            itemName={itemName}
            amount={amount}
            category={category}
            justification={justification}
            onNameChange={setItemName}
            onAmountChange={setAmount}
            onCategoryChange={setCategory}
            onJustificationChange={setJustification}
            onCancel={() => setView("overview")}
            onSubmit={submitPurchase}
          />
        ) : (
          <>
            <section aria-label="Monthly budget summary" className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Monthly budget"
                value={currency(TOTAL_BUDGET)}
                detail="Your full monthly allocation"
                icon={<Wallet aria-hidden="true" className="size-5" />}
                tone="neutral"
              />
              <MetricCard
                label="Safe-to-spend"
                value={currency(remaining)}
                detail={`${currency(SPEND_LIMIT)} monthly spending cap`}
                icon={<CreditCard aria-hidden="true" className="size-5" />}
                tone="primary"
              />
              <MetricCard
                label="Savings protected"
                value={currency(SAVINGS_GOAL)}
                detail="Reserved from everyday spending"
                icon={<LockKeyhole aria-hidden="true" className="size-5" />}
                tone="success"
              />
            </section>

            <section aria-labelledby="spending-title" className="mt-5 border-y border-border bg-card px-5 py-5 md:px-7 md:py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 id="spending-title" className="font-semibold">Spending at a glance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Your approved purchases count toward this month’s cap.</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums">{currency(totalSpent)} <span className="text-sm font-normal text-muted-foreground">of {currency(SPEND_LIMIT)}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">{utilization.toFixed(0)}% of spending cap used</p>
                </div>
              </div>
              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Spending cap used"
                aria-valuemin={0}
                aria-valuemax={SPEND_LIMIT}
                aria-valuenow={Math.min(totalSpent, SPEND_LIMIT)}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${utilization >= 90 ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${utilization}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> Approved spend</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-border" /> {currency(remaining)} available</span>
              </div>
            </section>

            <section aria-labelledby="activity-title" className="mt-8">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 id="activity-title" className="text-lg font-semibold">Purchase activity</h2>
                  <p className="mt-1 text-sm text-muted-foreground">A clear record of every decision.</p>
                </div>
                <div className="flex gap-1 border-b border-border" aria-label="Filter transactions">
                  {([
                    ["all", "All activity"],
                    ["approved", "Approved"],
                    ["blocked", "Blocked"],
                  ] as const).map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant="ghost"
                      aria-pressed={filter === value}
                      className={filter === value ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border border-y border-border bg-card">
                {visibleTransactions.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <ShoppingBag aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 font-medium">No purchases in this view</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try another filter or test a purchase.</p>
                  </div>
                ) : (
                  visibleTransactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))
                )}
              </div>
            </section>
          </>
        )}

        <footer className="mt-8 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4 text-primary" /> SpendGuard · Hackathon concept</span>
          <span>Sample activity is stored only for this session.</span>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: "neutral" | "primary" | "success";
}) {
  const iconTone = {
    neutral: "bg-secondary text-secondary-foreground",
    primary: "bg-accent text-accent-foreground",
    success: "bg-success-soft text-success",
  }[tone];

  return (
    <article className="border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-md ${iconTone}`}>{icon}</span>
      </div>
      <p className="mt-5 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

function PurchaseForm({
  itemName,
  amount,
  category,
  justification,
  onNameChange,
  onAmountChange,
  onCategoryChange,
  onJustificationChange,
  onCancel,
  onSubmit,
}: {
  itemName: string;
  amount: string;
  category: PurchaseCategory;
  justification: string;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: PurchaseCategory) => void;
  onJustificationChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="mx-auto max-w-3xl border border-border bg-card">
      <div className="border-b border-border px-5 py-5 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck aria-hidden="true" className="size-4" /> Spending guard</p>
            <h2 className="mt-2 text-2xl font-bold">Test a purchase</h2>
            <p className="mt-1 text-sm text-muted-foreground">See how a purchase affects your monthly plan.</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cancel purchase test" onClick={onCancel}><X aria-hidden="true" /></Button>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-5 px-5 py-6 md:px-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            <span>What are you buying?</span>
            <Input autoFocus value={itemName} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. Noise-cancelling headphones" required maxLength={80} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Purchase amount</span>
            <span className="relative block">
              <IndianRupee aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" type="number" min="1" step="1" inputMode="numeric" value={amount} onChange={(event) => onAmountChange(event.target.value)} placeholder="2,500" required />
            </span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Purchase category</span>
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value as PurchaseCategory)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Why do you need it? <span className="font-normal text-muted-foreground">Optional</span></span>
            <Input value={justification} onChange={(event) => onJustificationChange(event.target.value)} placeholder="Add a note for your own reference" maxLength={120} />
          </label>
        </div>
        {category === "essential" && (
          <div className="flex gap-3 border-l-4 border-warning bg-warning-soft px-4 py-3 text-sm">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>Essential purchases can use the demo override if they cross your spending cap.</p>
          </div>
        )}
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit"><ShieldCheck aria-hidden="true" /> Check this purchase <ChevronRight aria-hidden="true" /></Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">This test does not place an order or charge a payment method.</p>
      </form>
    </section>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const approved = transaction.status === "APPROVED";

  return (
    <article className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${approved ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          {approved ? <Check aria-hidden="true" className="size-4" /> : <X aria-hidden="true" className="size-4" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{transaction.itemName}</h3>
            <Badge variant="outline" className="font-normal">{categoryLabels[transaction.category]}</Badge>
            <Badge variant={approved ? "secondary" : "destructive"} className={approved ? "border-transparent bg-success-soft text-success hover:bg-success-soft" : "border-transparent bg-danger-soft text-danger hover:bg-danger-soft"}>
              {approved ? "Approved" : "Blocked"}
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{transaction.reason}</p>
          {transaction.justification && <p className="mt-1 text-xs text-muted-foreground">Your note: {transaction.justification}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{transaction.date} <span aria-hidden="true">·</span> {transaction.id}</p>
        </div>
      </div>
      <p className="shrink-0 pl-12 text-base font-semibold tabular-nums sm:pl-0">{approved ? <ArrowUpRight aria-label="Approved spend" className="mr-1 inline size-4 text-success" /> : <ArrowDownRight aria-label="Blocked purchase" className="mr-1 inline size-4 text-danger" />}{currency(transaction.amount)}</p>
    </article>
  );
}
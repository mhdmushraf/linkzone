// Shared plan configuration for Linkzone pricing, allowances and trial limits.

export const SETUP_FEE = 500; // AED, one-time, non-refundable (enterprise = custom; waived on annual billing)
export const TRIAL_LEAD_LIMIT = 50; // total lead pulls during the 14-day trial
export const TRIAL_WHATSAPP_LIMIT = 100; // total WhatsApp sends during the trial
export const MIN_TERM_MONTHS = 3; // monthly plans: minimum commitment
export const READ_ONLY_DAYS = 30; // grace window after cancellation/lapse

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 299,
    seats: 3,
    leadLimit: 100,
    tagline: "For solo reps and small teams",
    features: ["3 team members", "200 customers", "WhatsApp inbox", "Basic dashboard"],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 699,
    seats: 10,
    leadLimit: 500,
    tagline: "For growing distribution teams",
    features: ["10 team members", "Unlimited customers", "Lead Finder", "Reorder reminders", "Per-route analytics"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: null,
    seats: 50,
    leadLimit: null,
    tagline: "For large wholesale operations",
    features: ["50 team members", "Unlimited everything", "Advanced analytics", "Priority support", "Custom branding"],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p]));

export const getPlan = (planId) => PLAN_MAP[planId] || PLAN_MAP.starter;

// Pay annually: 12 months minus 2 free = monthly * 10
export const annualPrice = (monthly) => (monthly ? monthly * 10 : null);

// Setup fee per plan (enterprise = custom → null; waived on annual billing → 0)
export const setupFeeFor = (planId, billingCycle) =>
  planId === "enterprise" ? null : billingCycle === "annual" ? 0 : SETUP_FEE;

export const aed = (n) => (n === null || n === undefined ? "Custom" : `AED ${Number(n).toLocaleString()}`);
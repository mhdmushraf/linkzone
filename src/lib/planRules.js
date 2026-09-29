// Derived plan/subscription state helpers shared across pages.
import { differenceInDays } from "date-fns";
import {
  getPlan,
  TRIAL_LEAD_LIMIT,
  TRIAL_WHATSAPP_LIMIT,
} from "@/lib/plans";

const currentMonth = () => new Date().toISOString().slice(0, 7);

export const isTrial = (sub) => sub?.data?.status === "trial";

export const isCancelled = (sub) =>
  sub?.data?.status === "cancelled" || sub?.data?.status === "read_only";

// Read-only grace window after cancellation/lapse.
export const isReadOnly = (sub) => {
  if (!sub) return false;
  const s = sub.data.status;
  if (s !== "cancelled" && s !== "read_only") return false;
  if (sub.data.read_only_until) {
    return new Date(sub.data.read_only_until) > new Date();
  }
  return true;
};

export const readOnlyUntilDate = (sub) =>
  sub?.data?.read_only_until ? new Date(sub.data.read_only_until) : null;

export const trialDaysLeft = (sub) =>
  sub?.data?.trial_end
    ? Math.max(0, differenceInDays(new Date(sub.data.trial_end), new Date()))
    : null;

export const minTermEnd = (sub) =>
  sub?.data?.min_term_end ? new Date(sub.data.min_term_end) : null;

export const canCancelWithoutPenalty = (sub) => {
  if (isTrial(sub)) return true;
  const end = minTermEnd(sub);
  if (!end) return true;
  return new Date() >= end;
};

// Lead allowance for the current period. null = unlimited (enterprise).
export const leadAllowance = (sub) => {
  if (isTrial(sub)) return TRIAL_LEAD_LIMIT;
  return getPlan(sub?.data?.plan).leadLimit;
};

export const leadUsedThisPeriod = (sub) => {
  if (!sub) return 0;
  if (isTrial(sub)) return sub.data.lead_pulls_trial_used || 0;
  if (sub.data.lead_pulls_month !== currentMonth()) return 0;
  return sub.data.lead_pulls_used || 0;
};

export const whatsappUsedThisPeriod = (sub) => {
  if (!sub) return 0;
  if (isTrial(sub)) return sub.data.whatsapp_sends_used || 0;
  if (sub.data.whatsapp_sends_month !== currentMonth()) return 0;
  return sub.data.whatsapp_sends_used || 0;
};

export const canPullLeads = (sub) => {
  if (isReadOnly(sub)) return false;
  const allowance = leadAllowance(sub);
  if (allowance === null) return true;
  return leadUsedThisPeriod(sub) < allowance;
};

export const canSendWhatsApp = (sub) => {
  if (isReadOnly(sub)) return false;
  if (isTrial(sub)) return (sub?.data?.whatsapp_sends_used || 0) < TRIAL_WHATSAPP_LIMIT;
  return true;
};

export const canExport = (sub) => {
  if (isReadOnly(sub)) return true; // export of own data stays allowed during grace
  if (isTrial(sub)) return false; // disabled during trial
  return true;
};

export const canCreateOrder = (sub) => !isReadOnly(sub);
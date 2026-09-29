import { secrets } from "base44:runtime";

const STRIPE_VERSION = "2025-10-29.clover";
const BASE = "https://api.stripe.com/v1";

export function appId() {
  return secrets.get("BASE44_APP_ID") || "";
}

function buildForm(params) {
  const sp = new URLSearchParams();
  const add = (key, val) => {
    if (val === undefined || val === null) return;
    if (Array.isArray(val)) {
      val.forEach((v) => add(`${key}[]`, v));
    } else if (typeof val === "object") {
      for (const k of Object.keys(val)) add(`${key}[${k}]`, val[k]);
    } else {
      sp.append(key, String(val));
    }
  };
  for (const k of Object.keys(params || {})) add(k, params[k]);
  return sp;
}

export async function stripeApi(path, params = {}, method = "GET") {
  const sk = secrets.get("STRIPE_SECRET_KEY");
  if (!sk) throw new Error("STRIPE_SECRET_KEY not configured");
  const headers = { Authorization: `Bearer ${sk}`, "Stripe-Version": STRIPE_VERSION };
  const init = { method, headers };
  let url = `${BASE}/${path}`;
  if (method === "GET") {
    const qs = buildForm(params).toString();
    if (qs) url += `?${qs}`;
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    headers["Idempotency-Key"] = crypto.randomUUID();
    init.body = buildForm(params).toString();
  }
  const res = await fetch(url, init);
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || `Stripe ${path} failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// AED amounts in fils (smallest unit; AED has 2 decimals)
export const PLAN_AMOUNTS = {
  starter: { monthly: 29900, annual: 299000 },
  growth: { monthly: 69900, annual: 699000 },
};
export const SETUP_FEE_AMOUNT = 50000;

async function findProductByMeta(tag) {
  let hasMore = true;
  let startAfter = null;
  while (hasMore) {
    const params = { limit: 100, active: true };
    if (startAfter) params.starting_after = startAfter;
    const list = await stripeApi("products", params, "GET");
    const found = (list.data || []).find((p) => p.metadata && p.metadata.linkzone_product === tag);
    if (found) return found;
    hasMore = list.has_more;
    startAfter = list.data && list.data.length ? list.data[list.data.length - 1].id : null;
  }
  return null;
}

async function ensureProduct(tag, name) {
  const existing = await findProductByMeta(tag);
  if (existing) return existing.id;
  const created = await stripeApi("products", {
    name,
    metadata: { linkzone_product: tag, base44_app_id: appId() },
  }, "POST");
  return created.id;
}

async function findPrice(productId, currency, interval, cycle) {
  let hasMore = true;
  let startAfter = null;
  while (hasMore) {
    const params = { product: productId, active: true, limit: 100 };
    if (startAfter) params.starting_after = startAfter;
    const list = await stripeApi("prices", params, "GET");
    const found = (list.data || []).find((p) =>
      p.metadata && p.metadata.linkzone_cycle === cycle &&
      p.currency === currency &&
      (interval ? (p.recurring && p.recurring.interval === interval) : !p.recurring)
    );
    if (found) return found.id;
    hasMore = list.has_more;
    startAfter = list.data && list.data.length ? list.data[list.data.length - 1].id : null;
  }
  return null;
}

async function ensurePrice(productId, currency, unitAmount, interval, planId, cycle) {
  const existing = await findPrice(productId, currency, interval, cycle);
  if (existing) return existing;
  const priceParams = {
    product: productId,
    currency,
    unit_amount: unitAmount,
    metadata: { linkzone_plan: planId, linkzone_cycle: cycle, base44_app_id: appId() },
  };
  if (interval) priceParams.recurring = { interval };
  const created = await stripeApi("prices", priceParams, "POST");
  return created.id;
}

export async function ensurePlanPrice(planId, billingCycle) {
  const amounts = PLAN_AMOUNTS[planId];
  if (!amounts) return null;
  const name = "Linkzone " + planId.charAt(0).toUpperCase() + planId.slice(1);
  const productId = await ensureProduct(planId, name);
  const interval = billingCycle === "annual" ? "year" : "month";
  const unitAmount = billingCycle === "annual" ? amounts.annual : amounts.monthly;
  const priceId = await ensurePrice(productId, "aed", unitAmount, interval, planId, billingCycle);
  return { productId, priceId };
}

export async function ensureSetupFeePrice() {
  const productId = await ensureProduct("setup_fee", "Linkzone Setup Fee");
  const priceId = await ensurePrice(productId, "aed", SETUP_FEE_AMOUNT, null, "setup_fee", "one_time");
  return priceId;
}

export async function retrieveCard(paymentMethodId) {
  const pm = await stripeApi(`payment_methods/${paymentMethodId}`, {}, "GET");
  if (pm.card) return { brand: pm.card.brand, last4: pm.card.last4 };
  return { brand: null, last4: null };
}

export async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = {};
  sigHeader.split(",").forEach((p) => {
    const idx = p.indexOf("=");
    if (idx > -1) parts[p.slice(0, idx)] = p.slice(idx + 1);
  });
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const payload = `${t}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}
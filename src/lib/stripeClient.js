import { loadStripe } from "@stripe/stripe-js";
import { stripeConfig } from "@/functions/stripeConfig";

let stripePromise = null;
let keyPromise = null;

async function loadKey() {
  if (!keyPromise) {
    keyPromise = stripeConfig({}).then((res) => res.data.publishableKey);
  }
  return keyPromise;
}

export async function getStripe() {
  if (!stripePromise) {
    const key = await loadKey();
    if (!key) throw new Error("Stripe publishable key not configured");
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export const STRIPE_APPEARANCE = {
  theme: "flat",
  variables: {
    colorPrimary: "#6B4EF0",
    colorBackground: "#ffffff",
    colorText: "#17131F",
    colorDanger: "#dc2626",
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif",
    borderRadius: "10px",
  },
};
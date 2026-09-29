import { secrets } from "base44:runtime";

export default async function(req) {
  try {
    const key = secrets.get("STRIPE_PUBLISHABLE_KEY");
    if (!key) return Response.json({ error: "Stripe publishable key not configured" }, { status: 500 });
    return Response.json({ publishableKey: key });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
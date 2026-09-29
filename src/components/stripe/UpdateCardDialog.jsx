import { useEffect, useState } from "react";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getStripe, STRIPE_APPEARANCE } from "@/lib/stripeClient";
import { createSetupIntent } from "@/functions/createSetupIntent";
import { updateCard } from "@/functions/updateCard";
import { toast } from "@/components/ui/use-toast";

function CardForm({ onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setError("");
    if (!stripe || !elements) return;
    setSaving(true);
    try {
      const { error: err, setupIntent } = await stripe.confirmSetupIntent({ elements, redirect: "if_required" });
      if (err) {
        setError(err.message || "Card confirmation failed");
        setSaving(false);
        return;
      }
      const res = await updateCard({ setupIntentId: setupIntent.id });
      toast({ title: "Card updated", description: "Your new card is now on file." });
      onDone(res.data.card);
    } catch (e) {
      setError(e.message || "Failed to update card");
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="rounded-[10px] border border-border bg-white p-3 mb-3">
        <PaymentElement options={{ layout: { type: "tabs" } }} />
      </div>
      {error && <p className="text-xs text-destructive mb-3">{error}</p>}
      <DialogFooter>
        <Button disabled={!stripe || saving} onClick={handle} className="w-full h-11 rounded-[10px]">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            "Save card"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function UpdateCardDialog({ open, onOpenChange, onUpdated }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    if (open && !stripePromise) getStripe().then(setStripePromise).catch(() => {});
  }, [open, stripePromise]);

  useEffect(() => {
    if (open && !clientSecret) {
      createSetupIntent({})
        .then((res) => setClientSecret(res.data.clientSecret))
        .catch(() => {});
    }
    if (!open) setClientSecret(null);
  }, [open, clientSecret]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update card</DialogTitle>
        </DialogHeader>
        {stripePromise && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
            <CardForm
              onDone={(card) => {
                onOpenChange(false);
                if (onUpdated) onUpdated(card);
              }}
            />
          </Elements>
        ) : (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-faint" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
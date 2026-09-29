import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function PaymentSetup({ onBack, onConfirmed, submitting, noteText, submitLabel = "Start free trial" }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");

  const handleStart = async () => {
    setError("");
    if (!stripe || !elements) return;
    const { error: err, setupIntent } = await stripe.confirmSetupIntent({
      elements,
      redirect: "if_required",
    });
    if (err) {
      setError(err.message || "Card confirmation failed");
      return;
    }
    onConfirmed(setupIntent);
  };

  return (
    <div className="mt-5">
      <Label className="font-600 mb-1.5 block">Card details</Label>
      <div className="rounded-[10px] border border-border bg-white p-3">
        <PaymentElement options={{ layout: { type: "tabs" } }} />
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      {noteText && <p className="text-xs text-muted-foreground mt-3">{noteText}</p>}
      <div className="flex gap-3 mt-6">
        {onBack && (
          <Button variant="outline" className="h-12 flex-1 rounded-[10px] bg-white font-600" onClick={onBack} disabled={submitting}>
            Back
          </Button>
        )}
        <Button className="h-12 flex-1 rounded-[10px] font-600" disabled={!stripe || submitting} onClick={handleStart}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}
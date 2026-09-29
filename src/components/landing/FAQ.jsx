import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export const FAQS = [
  { q: "How does the trial work?", a: "Add your card at signup and nothing is charged for 14 days. On day 14, the one-time AED 500 setup fee plus your first month are charged automatically. Cancel before then and you pay nothing." },
  { q: "Do I need WhatsApp Business API?", a: "No. Linkzone works with the WhatsApp you already use. Your reps message shops from a shared inbox, and replies come straight back in." },
  { q: "Where does the shop data come from?", a: "Lead data is sourced and licensed for use inside your Linkzone subscription. It may not be resold or redistributed outside the platform." },
  { q: "Can I export my data?", a: "Yes. You can export your own customers, orders and products at any time. Lead-finder results are not exportable." },
  { q: "What happens if I cancel?", a: "Your workspace stays read-only for 30 days so you can export your data, after which it is archived." },
  { q: "Is my data separate from other companies?", a: "Yes. Every company gets its own isolated workspace — your customers, orders and conversations are never shared with anyone else." },
  { q: "Can I see customers on a map?", a: "Yes. Lead Finder and Customers both have a map view with filters, so you can find shops around any area and assign them to a route." },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-700 text-primary uppercase tracking-wider">FAQ</p>
          <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-base font-600 text-foreground hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-faint leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
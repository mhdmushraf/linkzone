import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, MessageCircle, Building2, Palette, Check, ShieldCheck, Phone, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const INDUSTRIES = ["FMCG distribution", "Spare parts", "Pharmacy trading", "IT & office supplies", "Stationery", "Packaging", "Other"];
const COLORS = ["#6B4EF0", "#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

const WHATSAPP_STEPS = [
  { icon: ShieldCheck, title: "Verify business", desc: "Confirm your business name and category with WhatsApp." },
  { icon: Phone, title: "Add your number", desc: "Connect your WhatsApp Business phone number." },
  { icon: Send, title: "Go live", desc: "Start sending offers and receiving replies in your inbox." },
];

export default function Settings() {
  const { organization, refresh } = useOrg();
  const [form, setForm] = useState({ name: "", industry: "", brand_color: "#6B4EF0", whatsapp_connected: false, whatsapp_phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.data.name || "",
        industry: organization.data.industry || "",
        brand_color: organization.data.brand_color || "#6B4EF0",
        whatsapp_connected: organization.data.whatsapp_connected || false,
        whatsapp_phone: organization.data.whatsapp_phone || "",
      });
    }
  }, [organization]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Organization.update(organization.id, form);
      toast({ title: "Settings saved" });
      refresh();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader action={
        <Button onClick={save} disabled={saving} className="h-11 rounded-[10px] font-600">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save changes
        </Button>
      } />

      <div className="max-w-2xl space-y-6">
        {/* Company profile */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-700 font-display" style={{ letterSpacing: "-0.02em" }}>Company profile</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-600">Company name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-[10px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-600">Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger className="h-11 rounded-[10px]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-whatsapp/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-whatsapp" />
              </div>
              <div>
                <h3 className="font-700 font-display" style={{ letterSpacing: "-0.02em" }}>WhatsApp</h3>
                <p className="text-xs text-faint">Connect your business number to send and receive offers</p>
              </div>
            </div>
            <Button
              onClick={() => setForm({ ...form, whatsapp_connected: !form.whatsapp_connected })}
              className="bg-whatsapp hover:bg-whatsapp/90 text-white rounded-[10px] font-600 h-10"
            >
              {form.whatsapp_connected ? "Connected" : "Connect number"}
            </Button>
          </div>

          {form.whatsapp_connected && (
            <div className="space-y-1.5 mb-5">
              <Label className="font-600">WhatsApp number</Label>
              <Input value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} placeholder="+1 555 0100" className="h-11 rounded-[10px]" />
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            {WHATSAPP_STEPS.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${form.whatsapp_connected && i === 0 ? "bg-success-muted text-success" : "bg-tint text-primary"}`}>
                  {form.whatsapp_connected && i < 2 ? <Check className="w-4 h-4" strokeWidth={3} /> : <s.icon className="w-4 h-4" />}
                </div>
                <p className="text-sm font-700 mb-1">{s.title}</p>
                <p className="text-xs text-faint leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="font-700 font-display" style={{ letterSpacing: "-0.02em" }}>Branding</h3>
          </div>
          <div className="space-y-3">
            <Label className="font-600">Brand color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, brand_color: c })}
                  className={`w-9 h-9 rounded-full transition-transform ${form.brand_color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="w-9 h-9 rounded-full cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
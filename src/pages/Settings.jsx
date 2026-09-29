import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, MessageCircle, Building2, Palette } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const INDUSTRIES = ["FMCG distribution", "Spare parts", "Pharmacy trading", "IT & office supplies", "Stationery", "Packaging", "Other"];
const COLORS = ["#6B4EF0", "#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

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
      <PageHeader title="Settings" subtitle="Company profile, WhatsApp and branding" />

      <div className="max-w-2xl space-y-6">
        {/* Company profile */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-600">Company profile</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h3 className="font-600">WhatsApp connection</h3>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 mb-4">
            <div>
              <p className="text-sm font-600">Connected</p>
              <p className="text-xs text-muted-foreground">Link your WhatsApp Business number</p>
            </div>
            <Switch checked={form.whatsapp_connected} onCheckedChange={(v) => setForm({ ...form, whatsapp_connected: v })} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp number</Label>
            <Input value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} placeholder="+1 555 0100" className="h-11" />
          </div>
          {!form.whatsapp_connected && (
            <p className="text-xs text-muted-foreground mt-3">Toggle on to enable sending offers and receiving replies in the Inbox.</p>
          )}
        </div>

        {/* Branding */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="font-600">Branding</h3>
          </div>
          <div className="space-y-3">
            <Label>Brand color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, brand_color: c })}
                  className={`w-9 h-9 rounded-full transition-transform ${form.brand_color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="w-9 h-9 rounded-full cursor-pointer" />
            </div>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="h-11">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </AppLayout>
  );
}
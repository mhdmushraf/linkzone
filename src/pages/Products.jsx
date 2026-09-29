import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";

export default function Products() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", pack_unit: "", price: "", sku: "", photo_url: "" });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const data = await base44.entities.Product.filter({ organization_id: orgId }, "-created_date", 500);
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orgId]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", pack_unit: "", price: "", sku: "", photo_url: "" });
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.data.name, pack_unit: p.data.pack_unit || "", price: p.data.price, sku: p.data.sku || "", photo_url: p.data.photo_url || "" });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        pack_unit: form.pack_unit,
        price: Number(form.price) || 0,
        sku: form.sku,
        photo_url: form.photo_url,
        organization_id: orgId,
      };
      if (editing) {
        await base44.entities.Product.update(editing.id, payload);
      } else {
        await base44.entities.Product.create(payload);
      }
      toast({ title: editing ? "Product updated" : "Product added" });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete ${p.data.name}?`)) return;
    await base44.entities.Product.delete(p.id);
    load();
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((f) => ({ ...f, photo_url: file_url }));
      toast({ title: "Photo uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const filtered = products.filter((p) =>
    !query ? true : p.data.name?.toLowerCase().includes(query.toLowerCase()) || p.data.sku?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        action={
          <Button onClick={openNew} className="h-11 rounded-[10px] font-600">
            <Plus className="w-4 h-4 mr-2" /> Add product
          </Button>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
        <Input placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 h-10 rounded-[10px] bg-card" />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start sending offers to shops."
          action={<Button onClick={openNew} className="rounded-[10px]"><Plus className="w-4 h-4 mr-2" /> Add product</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden group">
              <div className="aspect-square relative bg-gradient-to-br from-tint to-[hsl(var(--chart-lavender))]">
                {p.data.photo_url ? (
                  <Image src={p.data.photo_url} alt={p.data.name} className="w-full h-full" fittingType="fill" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg bg-white/90 shadow flex items-center justify-center hover:bg-white">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(p)} className="w-8 h-8 rounded-lg bg-white/90 shadow flex items-center justify-center hover:bg-white text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-600 text-sm truncate">{p.data.name}</p>
                <p className="text-xs text-faint truncate mb-1">{p.data.pack_unit || "—"}</p>
                <p className="font-extrabold font-display text-base" style={{ letterSpacing: "-0.02em" }}>AED {p.data.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Product name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coca Cola 500ml" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Pack / unit</Label>
                <Input value={form.pack_unit} onChange={(e) => setForm({ ...form, pack_unit: e.target.value })} placeholder="Case of 24" />
              </div>
              <div className="space-y-2">
                <Label>Price (AED)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="12.50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SKU (optional)</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-3">
                {form.photo_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                    <Image src={form.photo_url} alt="preview" className="w-full h-full" fittingType="fill" />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={onUpload} className="flex-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.price}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? "Save" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Bell, Download, Lock, Sparkles } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { downloadCSV } from "@/lib/csv";
import { isTrial, isReadOnly, canExport } from "@/lib/planRules";
import { toast } from "@/components/ui/use-toast";

export default function Orders() {
  const { organization, team, subscription } = useOrg();
  const orgId = organization?.id;
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [o, c] = await Promise.all([
      base44.entities.Order.filter({ organization_id: orgId }, "-order_date", 500),
      base44.entities.Customer.filter({ organization_id: orgId }, "-created_date", 500),
    ]);
    setOrders(o);
    setCustomers(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orgId]);

  const repName = (id) => team.find((t) => t.id === id)?.data?.name || "—";

  // Reorder reminders: customers with no order in 30+ days
  const reorderReminders = useMemo(() => {
    return customers
      .map((c) => {
        const custOrders = orders.filter((o) => o.data.customer_id === c.id);
        const last = custOrders.sort((a, b) => (b.data.order_date || "").localeCompare(a.data.order_date || ""))[0];
        const days = last ? differenceInDays(new Date(), new Date(last.data.order_date)) : null;
        return { customer: c, lastOrder: last, days };
      })
      .filter((r) => r.days === null || r.days >= 30)
      .sort((a, b) => (b.days ?? 999) - (a.days ?? 999));
  }, [customers, orders]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.data.paid_status === filter);
  }, [orders, filter]);

  const totalRevenue = orders.reduce((s, o) => s + (o.data.amount || 0), 0);
  const dueAmount = orders.filter((o) => o.data.paid_status !== "paid").reduce((s, o) => s + (o.data.amount || 0), 0);

  const trial = isTrial(subscription);
  const readOnly = isReadOnly(subscription);
  const exportBlocked = !canExport(subscription);

  const exportCSV = () => {
    if (exportBlocked) return;
    const rows = filtered.map((o) => ({
      customer: o.data.customer_name || "",
      rep: repName(o.data.salesman_id),
      date: o.data.order_date ? format(new Date(o.data.order_date), "yyyy-MM-dd") : "",
      amount: o.data.amount || 0,
      paid_status: o.data.paid_status || "",
      delivery_status: o.data.delivery_status || "",
    }));
    downloadCSV("linkzone-orders.csv", rows);
    toast({ title: "Export ready", description: `${rows.length} orders exported.` });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {readOnly && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 mb-4">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm">Account is in read-only mode. Creating orders is paused; exporting your own data is still allowed.</p>
        </div>
      )}
      {trial && (
        <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 mb-4">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
          <p className="text-sm">Trial mode — CSV export is disabled until your first payment on day 14.</p>
        </div>
      )}
      <PageHeader
        title="Orders"
        subtitle="Logged orders and delivery status"
        action={
          <Button variant="outline" onClick={exportCSV} disabled={exportBlocked} className="h-11" title={exportBlocked ? "Export is disabled during the trial" : "Export orders (CSV)"}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total orders</p>
          <p className="text-2xl font-700 font-heading mt-1">{orders.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-2xl font-700 font-heading mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-700 font-heading mt-1 text-rose-500">${dueAmount.toLocaleString()}</p>
        </div>
      </div>

      {reorderReminders.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="font-600 text-sm">{reorderReminders.length} shops due for reorder</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {reorderReminders.slice(0, 3).map((r) => r.customer.data.business_name).join(", ")}
              {reorderReminders.length > 3 && ` +${reorderReminders.length - 3} more`}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {["all", "due", "paid", "partial"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-500 capitalize transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders created from chats will appear here." />
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3 font-500">Customer</th>
                  <th className="px-4 py-3 font-500">Rep</th>
                  <th className="px-4 py-3 font-500">Date</th>
                  <th className="px-4 py-3 font-500 text-right">Amount</th>
                  <th className="px-4 py-3 font-500">Payment</th>
                  <th className="px-4 py-3 font-500">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-600">{o.data.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{repName(o.data.salesman_id)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.data.order_date ? format(new Date(o.data.order_date), "dd MMM") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-700">${(o.data.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.data.paid_status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.data.delivery_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
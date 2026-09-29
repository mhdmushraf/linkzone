import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { Users, MessageCircle, TrendingUp, DollarSign, Route as RouteIcon, Loader2, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Link } from "react-router-dom";

const FOCUS_COLORS = { reorder: "bg-accent", reply: "bg-success", dispatch: "bg-primary", new: "bg-whatsapp" };

export default function Dashboard() {
  const { organization, team } = useOrg();
  const orgId = organization?.id;
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const [c, o, conv, r] = await Promise.all([
          base44.entities.Customer.filter({ organization_id: orgId }, "-created_date", 500),
          base44.entities.Order.filter({ organization_id: orgId }, "-order_date", 500),
          base44.entities.Conversation.filter({ organization_id: orgId }, "-last_message_at", 500),
          base44.entities.Route.filter({ organization_id: orgId }, "-created_date", 500),
        ]);
        setCustomers(c);
        setOrders(o);
        setConversations(conv);
        setRoutes(r);
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  const stats = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.data.status === "active").length;
    const newCustomers = customers.filter((c) => c.data.status === "new").length;
    const offersSent = conversations.length;
    const replied = conversations.filter((c) => c.data.last_message).length;
    const replyRate = offersSent ? Math.round((replied / offersSent) * 100) : 0;
    const revenue = orders.reduce((sum, o) => sum + (o.data.amount || 0), 0);
    const pendingDelivery = orders.filter((o) => o.data.delivery_status === "pending").length;
    return { activeCustomers, newCustomers, offersSent, replied, replyRate, revenue, pendingDelivery };
  }, [customers, orders, conversations]);

  const ordersByDay = useMemo(() => {
    const map = {};
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
      days.push({ date: key, label: d.toLocaleDateString("en", { weekday: "short" }), amount: 0 });
    }
    orders.forEach((o) => {
      const key = (o.data.order_date || o.created_date || "").slice(0, 10);
      if (map[key] !== undefined) map[key] += o.data.amount || 0;
    });
    days.forEach((d) => (d.amount = map[d.date]));
    return days;
  }, [orders]);

  const todayFocus = useMemo(() => {
    const items = [];
    customers.filter((c) => c.data.status === "to_reorder").slice(0, 2).forEach((c) =>
      items.push({ type: "reorder", text: `Reorder ${c.data.business_name}`, to: "/customers" }));
    conversations.filter((c) => c.data.last_message).slice(0, 2).forEach((c) =>
      items.push({ type: "reply", text: `Reply to ${c.data.customer_name}`, to: "/inbox" }));
    orders.filter((o) => o.data.delivery_status === "pending").slice(0, 2).forEach((o) =>
      items.push({ type: "dispatch", text: `Dispatch order — ${o.data.customer_name}`, to: "/orders" }));
    customers.filter((c) => c.data.status === "new").slice(0, 2).forEach((c) =>
      items.push({ type: "new", text: `Call ${c.data.business_name}`, to: "/customers" }));
    return items.slice(0, 5);
  }, [customers, conversations, orders]);

  const routeBreakdown = useMemo(() => {
    return routes.map((r) => {
      const routeCustomers = customers.filter((c) => c.data.route_id === r.id);
      const routeOrders = orders.filter((o) => routeCustomers.some((c) => c.id === o.data.customer_id));
      const rep = team.find((t) => t.id === r.data.assigned_to);
      return {
        name: r.data.name,
        customers: routeCustomers.length,
        revenue: routeOrders.reduce((s, o) => s + (o.data.amount || 0), 0),
        rep: rep?.data?.name || rep?.email || "Unassigned",
      };
    });
  }, [routes, customers, orders, team]);

  const recentOrders = useMemo(() => [...orders].sort((a, b) => new Date(b.data.order_date || b.created_date) - new Date(a.data.order_date || a.created_date)).slice(0, 6), [orders]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active customers" value={stats.activeCustomers} icon={Users} delta={stats.newCustomers ? `+${stats.newCustomers} new` : null} deltaUp />
        <StatCard label="Offers sent" value={stats.offersSent} icon={MessageCircle} delta={stats.replied ? `${stats.replied} replied` : null} deltaUp />
        <StatCard label="Reply rate" value={`${stats.replyRate}%`} icon={TrendingUp} delta={stats.replyRate >= 50 ? "On target" : "Below target"} deltaUp={stats.replyRate >= 50} accent />
        <StatCard label="Revenue influenced" value={`AED ${stats.revenue.toLocaleString()}`} icon={DollarSign} delta={stats.pendingDelivery ? `${stats.pendingDelivery} to dispatch` : null} deltaUp />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <h3 className="font-700 font-display text-base mb-4" style={{ letterSpacing: "-0.02em" }}>Orders over time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--faint))", fontFamily: "Figtree" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--faint))", fontFamily: "Figtree" }} />
              <Tooltip
                cursor={{ fill: "hsl(var(--tint))" }}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 13, fontFamily: "Figtree" }}
                formatter={(v) => [`AED ${v}`, "Revenue"]}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {ordersByDay.map((entry, i) => (
                  <Cell key={i} fill={i >= ordersByDay.length - 2 ? "hsl(var(--primary))" : "hsl(var(--chart-lavender))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-700 font-display text-base mb-4" style={{ letterSpacing: "-0.02em" }}>Today's focus</h3>
          {todayFocus.length === 0 ? (
            <p className="text-sm text-faint py-6 text-center">Nothing pending — you're all caught up.</p>
          ) : (
            <div className="space-y-3">
              {todayFocus.map((item, i) => (
                <Link key={i} to={item.to} className="flex items-center gap-3 group">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${FOCUS_COLORS[item.type]}`} />
                  <span className="text-sm font-500 flex-1 truncate group-hover:text-primary transition-colors">{item.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-faint group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <h3 className="font-700 font-display text-base mb-4" style={{ letterSpacing: "-0.02em" }}>Recent orders</h3>
        {recentOrders.length === 0 ? (
          <EmptyState icon={Users} title="No orders yet" description="Orders you create from the inbox will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-faint border-b border-border">
                  <th className="pb-2 font-600">Customer</th>
                  <th className="pb-2 font-600 hidden sm:table-cell">Items</th>
                  <th className="pb-2 font-600 text-right">Amount</th>
                  <th className="pb-2 font-600 text-right">Payment</th>
                  <th className="pb-2 font-600 text-right hidden sm:table-cell">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-tint text-primary flex items-center justify-center text-xs font-700 shrink-0">
                          {(o.data.customer_name || "?")[0]?.toUpperCase()}
                        </div>
                        <span className="font-600 truncate">{o.data.customer_name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-faint hidden sm:table-cell">{o.data.items?.length || 0}</td>
                    <td className="py-3 text-right font-700 font-display">AED {(o.data.amount || 0).toLocaleString()}</td>
                    <td className="py-3 text-right"><StatusBadge status={o.data.paid_status} /></td>
                    <td className="py-3 text-right hidden sm:table-cell"><StatusBadge status={o.data.delivery_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-700 font-display text-base mb-4 flex items-center gap-2" style={{ letterSpacing: "-0.02em" }}>
            <RouteIcon className="w-4 h-4 text-primary" /> By route
          </h3>
          {routeBreakdown.length === 0 ? (
            <p className="text-sm text-faint py-6 text-center">No routes yet.</p>
          ) : (
            <div className="space-y-3">
              {routeBreakdown.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-600 truncate">{r.name}</p>
                    <p className="text-xs text-faint truncate">{r.rep}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-700 font-display">AED {r.revenue.toLocaleString()}</p>
                    <p className="text-xs text-faint">{r.customers} shops</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
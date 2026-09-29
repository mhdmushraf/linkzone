import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { Users, MessageCircle, TrendingUp, DollarSign, Route as RouteIcon, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
    const offersSent = conversations.length;
    const replied = conversations.filter((c) => c.data.last_message).length;
    const replyRate = offersSent ? Math.round((replied / offersSent) * 100) : 0;
    const revenue = orders.reduce((sum, o) => sum + (o.data.amount || 0), 0);
    return { activeCustomers, offersSent, replyRate, revenue };
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
      if (map[key] !== undefined) {
        map[key] += o.data.amount || 0;
      }
    });
    days.forEach((d) => (d.amount = map[d.date]));
    return days;
  }, [orders]);

  const routeBreakdown = useMemo(() => {
    return routes.map((r) => {
      const routeCustomers = customers.filter((c) => c.data.route_id === r.id);
      const routeOrders = orders.filter((o) => routeCustomers.some((c) => c.id === o.data.customer_id));
      const rep = team.find((t) => t.id === r.data.assigned_to);
      return {
        name: r.data.name,
        area: r.data.area,
        customers: routeCustomers.length,
        revenue: routeOrders.reduce((s, o) => s + (o.data.amount || 0), 0),
        rep: rep?.data?.name || rep?.email || "Unassigned",
      };
    });
  }, [routes, customers, orders, team]);

  const repBreakdown = useMemo(() => {
    return team.map((t) => {
      const tCustomers = customers.filter((c) => c.data.assigned_to === t.id);
      const tOrders = orders.filter((o) => o.data.salesman_id === t.id);
      return {
        name: t.data?.name || t.email,
        role: t.data?.app_role,
        customers: tCustomers.length,
        offers: conversations.filter((c) => c.data.salesman_id === t.id).length,
        revenue: tOrders.reduce((s, o) => s + (o.data.amount || 0), 0),
      };
    });
  }, [team, customers, orders, conversations]);

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
      <PageHeader title="Dashboard" subtitle="Your sales at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active customers" value={stats.activeCustomers} icon={Users} />
        <StatCard label="Offers sent" value={stats.offersSent} icon={MessageCircle} />
        <StatCard label="Reply rate" value={`${stats.replyRate}%`} icon={TrendingUp} accent />
        <StatCard label="Revenue influenced" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <h3 className="font-600 mb-4">Orders this week</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(250 20% 92%)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(250 10% 45%)" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(250 10% 45%)" }} />
              <Tooltip
                cursor={{ fill: "hsl(255 82% 62% / 0.05)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(250 20% 92%)", fontSize: 13 }}
                formatter={(v) => [`$${v}`, "Revenue"]}
              />
              <Bar dataKey="amount" fill="hsl(255 82% 62%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <h3 className="font-600 mb-4 flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-primary" /> By route
          </h3>
          {routeBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No routes yet.</p>
          ) : (
            <div className="space-y-3">
              {routeBreakdown.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-600 truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.rep}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-600">${r.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{r.customers} shops</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <h3 className="font-600 mb-4">By salesperson</h3>
        {repBreakdown.length === 0 ? (
          <EmptyState icon={Users} title="No team members yet" description="Invite your sales team to see their performance." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-500">Rep</th>
                  <th className="pb-2 font-500">Role</th>
                  <th className="pb-2 font-500 text-right">Customers</th>
                  <th className="pb-2 font-500 text-right">Offers</th>
                  <th className="pb-2 font-500 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {repBreakdown.map((r) => (
                  <tr key={r.name} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-600">{r.name}</td>
                    <td className="py-3">{r.role && <StatusBadge status={r.role} />}</td>
                    <td className="py-3 text-right">{r.customers}</td>
                    <td className="py-3 text-right">{r.offers}</td>
                    <td className="py-3 text-right font-600">${r.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
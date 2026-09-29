import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useOrg } from "@/lib/OrgContext";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  Users,
  Search,
  Package,
  MessageCircle,
  ShoppingCart,
  UserCog,
  Settings as SettingsIcon,
  CreditCard,
  LogOut,
  Menu,
  Home as HomeIcon,
  MoreHorizontal,
  Store,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { isReadOnly, readOnlyUntilDate, isTrial, trialDaysLeft } from "@/lib/planRules";
import { getPlan, setupFeeFor, annualPrice, aed } from "@/lib/plans";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/dashboard", label: "Dashboard", subtitle: "Your sales at a glance", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", subtitle: "WhatsApp conversations with your customers", icon: MessageCircle },
  { to: "/customers", label: "Customers", subtitle: "Manage your shops and routes", icon: Users },
  { to: "/products", label: "Products", subtitle: "Your catalog of products and offers", icon: Package },
  { to: "/lead-finder", label: "Lead Finder", subtitle: "Find new shops by area and industry", icon: Search },
  { to: "/orders", label: "Orders", subtitle: "Track orders by route and salesman", icon: ShoppingCart },
  { to: "/team", label: "Team", subtitle: "Invite teammates and assign roles", icon: UserCog },
  { to: "/settings", label: "Settings", subtitle: "Company profile, WhatsApp and branding", icon: SettingsIcon },
  { to: "/billing", label: "Billing", subtitle: "Manage your plan and subscription", icon: CreditCard },
];

const MOBILE_TABS = [
  { to: "/dashboard", label: "Home", icon: HomeIcon },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
];

const ROLE_LABEL = { owner: "Owner", manager: "Manager", sales: "Sales rep", viewer: "Viewer" };

export default function AppLayout({ children }) {
  const { organization, subscription, appRole, user } = useOrg();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  const current = NAV.find((n) => (n.to === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(n.to))) || NAV[0];

  const initials = (user?.data?.name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const trialDays = (() => {
    if (!subscription?.data?.trial_end) return null;
    const left = Math.ceil((new Date(subscription.data.trial_end) - new Date()) / 86400000);
    return Math.max(0, left);
  })();
  const planName = (subscription?.data?.plan || "growth").charAt(0).toUpperCase() + (subscription?.data?.plan || "growth").slice(1);

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-5 h-16 shrink-0">
        <Logo size={32} />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-600 transition-colors",
                isActive ? "bg-tint text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 space-y-2">
        {subscription?.data?.status === "trial" && trialDays !== null && (
          <NavLink to="/billing" onClick={() => setMobileOpen(false)} className="block">
            <div className="rounded-2xl bg-primary p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-700 font-display">{planName} plan</span>
              </div>
              <p className="text-xs text-white/80 mb-3">Trial ends in {trialDays} days</p>
              <button className="w-full h-8 rounded-lg bg-white text-primary text-xs font-700 hover:bg-white/90 transition-colors">
                Upgrade
              </button>
            </div>
          </NavLink>
        )}

        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-700 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-600 truncate">{user?.data?.name || "User"}</p>
            <p className="text-xs text-faint truncate">{ROLE_LABEL[appRole]}</p>
          </div>
          <button onClick={handleLogout} className="text-faint hover:text-foreground p-1.5 rounded-md hover:bg-muted" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const moreItems = NAV.filter((n) => !MOBILE_TABS.some((t) => t.to === n.to));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[252px] bg-sidebar border-r border-sidebar-border flex-col z-40">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[252px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {SidebarInner}
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[252px] pb-20 lg:pb-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-lg lg:text-xl tracking-tight truncate" style={{ letterSpacing: "-0.02em" }}>
                {current.label}
              </h1>
              <p className="text-xs text-faint truncate hidden sm:block">{current.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {subscription?.data?.status === "trial" && trialDays !== null && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-600 bg-success-muted text-success px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {trialDays}d left
              </span>
            )}
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-700">
              {initials}
            </div>
          </div>
        </header>

        {isReadOnly(subscription) && (() => {
          const until = readOnlyUntilDate(subscription);
          return (
            <div className="flex items-center gap-3 px-4 lg:px-8 py-2.5 bg-destructive/10 border-b border-destructive/20 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              <span className="text-foreground">
                Account is read-only{until ? ` — closes on ${format(until, "dd MMM yyyy")}` : ""}. Export your data from Customers and Orders.
              </span>
            </div>
          );
        })()}
        {subscription?.data?.status === "past_due" && (
          <div className="flex items-center gap-3 px-4 lg:px-8 py-2.5 bg-destructive/10 border-b border-destructive/20 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            <span className="text-foreground">
              Your last payment failed — <NavLink to="/billing" className="font-600 text-primary hover:underline">update your card</NavLink> so we can retry the charge.
            </span>
          </div>
        )}
        {isTrial(subscription) && (() => {
          const left = trialDaysLeft(subscription);
          if (left === null || left > 3) return null;
          const planDef = getPlan(subscription?.data?.plan);
          const cyc = subscription?.data?.billing_cycle || "monthly";
          const fee = setupFeeFor(subscription?.data?.plan, cyc);
          const cycAmount = cyc === "annual" ? annualPrice(planDef.monthly) : planDef.monthly;
          const amount = fee === null ? cycAmount : fee === 0 ? cycAmount : (fee + cycAmount);
          const date = subscription?.data?.trial_end ? format(new Date(subscription.data.trial_end), "dd MMM yyyy") : "day 14";
          return (
            <div className="flex items-center gap-3 px-4 lg:px-8 py-2.5 bg-warning-muted border-b border-warning/30 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
              <span className="text-foreground">
                Your card will be charged {amount ? aed(amount) : ""} on {date}.
              </span>
            </div>
          );
        })()}
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex items-center justify-around h-16 px-2">
        {MOBILE_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-600 transition-colors flex-1",
                isActive ? "text-primary" : "text-faint"
              )
            }
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-600 text-faint flex-1"
        >
          <MoreHorizontal className="w-5 h-5" />
          More
        </button>
      </nav>

      {/* More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {moreItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border hover:bg-tint"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-600 text-center">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
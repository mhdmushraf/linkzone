import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useOrg } from "@/lib/OrgContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  Search,
  Package,
  MessageCircle,
  ShoppingCart,
  UserCog,
  Settings,
  CreditCard,
  Sparkles,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/lead-finder", label: "Lead Finder", icon: Search },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/team", label: "Team", icon: UserCog },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

const ROLE_LABEL = { owner: "Owner", manager: "Manager", sales: "Sales rep", viewer: "Viewer" };

export default function AppLayout({ children }) {
  const { organization, subscription, appRole, user } = useOrg();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  const initials = (user?.data?.name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-heading font-700 text-lg tracking-tight">Linkzone</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-500 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-600 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-600 truncate">{user?.data?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{ROLE_LABEL[appRole]}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex-col">
        {SidebarInner}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-sidebar border-r border-sidebar-border h-full">{SidebarInner}</div>
          <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-600">{organization?.data?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{organization?.data?.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {subscription?.data?.status === "trial" && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-500 bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Trial
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-600">
              {initials}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
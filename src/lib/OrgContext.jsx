import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { joinOrg } from "@/functions/joinOrg";

const OrgContext = createContext(null);

export const OrgProvider = ({ children }) => {
  const { user, isAuthenticated, authChecked } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const loadOrg = useCallback(async () => {
    if (!user) return;
    const orgId = user.data?.organization_id;
    if (!orgId) {
      // Check for a pending team invite by email
      try {
        const invites = await base44.entities.TeamInvite.filter({ email: user.email, status: "pending" });
        if (invites.length > 0) {
          const invite = invites[0];
          await base44.auth.updateMe({
            organization_id: invite.data.organization_id,
            app_role: invite.data.app_role,
            name: user.data?.name || user.email.split("@")[0],
          });
          // Add user to org members + accept invite via service-role function (bypasses org RLS)
          try {
            await joinOrg({ inviteId: invite.id });
          } catch (e) {
            console.error("joinOrg failed", e);
          }
          window.location.reload();
          return;
        }
      } catch (e) {
        console.error("invite check failed", e);
      }
      setNeedsOnboarding(true);
      setLoading(false);
      return;
    }
    try {
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      if (orgs.length > 0) setOrganization(orgs[0]);
      const subs = await base44.entities.Subscription.filter({ organization_id: orgId });
      if (subs.length > 0) setSubscription(subs[0]);
      const users = await base44.entities.User.list();
      setTeam(users.filter((u) => u.data?.organization_id === orgId));
    } catch (e) {
      console.error("org load failed", e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authChecked && isAuthenticated && user) {
      loadOrg();
    } else if (authChecked && !isAuthenticated) {
      setLoading(false);
    }
  }, [authChecked, isAuthenticated, user, loadOrg]);

  const refresh = () => {
    setOrganization(null);
    setSubscription(null);
    setLoading(true);
    loadOrg();
  };

  return (
    <OrgContext.Provider
      value={{
        organization,
        subscription,
        team,
        loading,
        needsOnboarding,
        refresh,
        appRole: user?.data?.app_role || "viewer",
        user,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
};
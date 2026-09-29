import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useOrg } from "@/lib/OrgContext";

export default function AppShell() {
  const { loading, needsOnboarding } = useOrg();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
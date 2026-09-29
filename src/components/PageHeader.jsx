import React from "react";

export default function PageHeader({ action }) {
  if (!action) return null;
  return <div className="flex justify-end mb-5">{action}</div>;
}
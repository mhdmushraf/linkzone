import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function BulkAddDialog({ open, onClose, count, routes, team, onConfirm }) {
  const [routeId, setRouteId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setRouteId(""); setAssignedTo(""); setSaving(false); } }, [open]);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm({ route_id: routeId || null, assigned_to: assignedTo || null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add {count} {count === 1 ? "lead" : "leads"} as customers</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Assign to route</Label>
            <Select value={routeId || "none"} onValueChange={(v) => setRouteId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No route" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No route</SelectItem>
                {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.data.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign salesman</Label>
            <Select value={assignedTo || "none"} onValueChange={(v) => setAssignedTo(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={saving || count === 0}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add {count} customers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
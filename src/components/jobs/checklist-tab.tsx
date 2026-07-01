"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChecklistTab({
  jobId,
  items: initial,
  isOffice,
}: {
  jobId: string;
  items: ChecklistItem[];
  isOffice: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const done = items.filter(i => i.is_completed).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  async function toggle(item: ChecklistItem) {
    const updated = items.map(i => i.id === item.id ? { ...i, is_completed: !i.is_completed } : i);
    setItems(updated);
    const supabase = createClient();
    const { error } = await supabase
      .from("job_checklist_items")
      .update({ is_completed: !item.is_completed, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      setItems(items);
    }
  }

  async function addItem() {
    if (!newLabel.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("job_checklist_items")
      .insert({ job_id: jobId, label: newLabel.trim(), sort_order: items.length, created_by: user?.id })
      .select()
      .single<ChecklistItem>();
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    if (data) setItems([...items, data]);
    setNewLabel("");
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("job_checklist_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems(items.filter(i => i.id !== id));
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Progress</span>
            <span className="text-sm font-bold text-indigo-600">{done}/{items.length} done</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="divide-y divide-slate-100">
        {items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">No checklist items yet.</p>
        )}
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 px-5 py-3.5 transition-colors",
              item.is_completed ? "bg-emerald-50/40" : "hover:bg-slate-50"
            )}
          >
            <button
              onClick={() => toggle(item)}
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                item.is_completed
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-slate-300 hover:border-indigo-400"
              )}
              aria-label={item.is_completed ? "Mark incomplete" : "Mark complete"}
            >
              {item.is_completed && (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={cn(
              "flex-1 text-sm",
              item.is_completed ? "line-through text-slate-400" : "text-slate-800 font-medium"
            )}>
              {item.label}
            </span>
            {isOffice && (
              <button
                onClick={() => deleteItem(item.id)}
                className="text-slate-300 hover:text-rose-500 transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add item (office only) */}
      {isOffice && (
        <div className="border-t border-slate-100 p-4 flex gap-2">
          <input
            type="text"
            placeholder="Add checklist item…"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addItem()}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={addItem}
            disabled={adding || !newLabel.trim()}
            className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {adding ? "…" : "+ Add"}
          </button>
        </div>
      )}
    </div>
  );
}
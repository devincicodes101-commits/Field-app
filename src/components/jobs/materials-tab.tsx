"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Material } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MaterialsTab({
  jobId,
  materials: initial,
  isOffice,
}: {
  jobId: string;
  materials: Material[];
  isOffice: boolean;
}) {
  const [materials, setMaterials] = useState(initial);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("m");
  const [cost, setCost] = useState("");
  const [adding, setAdding] = useState(false);

  const total = materials.reduce((sum, m) => sum + m.quantity * m.unit_cost, 0);

  async function addMaterial() {
    if (!name.trim() || !qty || !cost) return;
    setAdding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("job_materials")
      .insert({
        job_id: jobId,
        name: name.trim(),
        quantity: parseFloat(qty),
        unit: unit.trim() || "m",
        unit_cost: parseFloat(cost),
        added_by: user?.id,
      })
      .select()
      .single<Material>();
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    if (data) setMaterials([...materials, data]);
    setName(""); setQty(""); setUnit("m"); setCost("");
  }

  async function deleteMaterial(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("job_materials").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setMaterials(materials.filter(m => m.id !== id));
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table */}
      {materials.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Item</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Unit</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Unit £</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Total</th>
                {isOffice && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3.5 text-right text-slate-600">{m.quantity}</td>
                  <td className="px-4 py-3.5 text-slate-500">{m.unit}</td>
                  <td className="px-4 py-3.5 text-right text-slate-600">£{m.unit_cost.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                    £{(m.quantity * m.unit_cost).toFixed(2)}
                  </td>
                  {isOffice && (
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => deleteMaterial(m.id)}
                        className="text-slate-300 hover:text-rose-500 text-lg leading-none transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-indigo-50">
                <td colSpan={isOffice ? 4 : 4} className="px-5 py-3 font-bold text-slate-700 text-sm">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-black text-indigo-700 text-base">
                  £{total.toFixed(2)}
                </td>
                {isOffice && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-10">No materials logged yet.</p>
      )}

      {/* Add form */}
      <div className="border-t border-slate-100 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Add material</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input
            className="col-span-2 sm:col-span-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Name (e.g. Pipe)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="number"
            step="0.01"
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Qty"
            value={qty}
            onChange={e => setQty(e.target.value)}
          />
          <input
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Unit (m, kg…)"
            value={unit}
            onChange={e => setUnit(e.target.value)}
          />
          <input
            type="number"
            step="0.01"
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Unit cost £"
            value={cost}
            onChange={e => setCost(e.target.value)}
          />
        </div>
        <button
          onClick={addMaterial}
          disabled={adding || !name.trim() || !qty || !cost}
          className="mt-2 w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {adding ? "Adding…" : "+ Add material"}
        </button>
      </div>
    </div>
  );
}
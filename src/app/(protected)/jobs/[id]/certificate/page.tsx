import { createClient } from "@/lib/supabase/server";
import type { Job, JobCompletion, Invoice } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).single<Job>();
  if (!job) notFound();

  const { data: completion } = await supabase
    .from("job_completions")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<JobCompletion>();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Invoice>();

  let signatureUrl: string | null = null;
  if (completion?.customer_signature) {
    signatureUrl = completion.customer_signature;
  }

  function fmt(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  const stars = (n: number | null) => n ? "★".repeat(n) + "☆".repeat(5 - n) : "—";

  return (
    <div className="min-h-screen bg-white">
      {/* Print button - hidden on print */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <a href={`/jobs/${id}`} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
          ← Back
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#0f172a] text-white rounded-lg text-sm font-bold hover:bg-[#1e293b] shadow-md"
        >
          🖨 Print
        </button>
      </div>

      {/* Certificate */}
      <div className="max-w-2xl mx-auto px-8 py-12 print:py-6 print:px-6">
        {/* Branded header */}
        <div className="bg-[#0f172a] rounded-xl px-6 py-5 flex items-start justify-between mb-8 print:rounded-none">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center bg-[#ea580c] text-white font-extrabold text-xs px-3 py-2.5 rounded-lg leading-none">
              AUK
            </span>
            <div>
              <span className="block text-white font-extrabold text-[15px] leading-tight">Asbestos UK Teams</span>
              <span className="block text-slate-400 text-xs">Certificate of Completion</span>
            </div>
          </div>
          {invoice && (
            <div className="text-right">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Invoice</p>
              <p className="text-lg font-black text-[#ea580c]">{invoice.invoice_number}</p>
            </div>
          )}
        </div>

        {/* Job details */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{job.title}</h2>
            <p className="text-slate-500 mt-1 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.address}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client</h3>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-slate-900">{job.client_name}</p>
                {job.client_email && <p className="text-slate-500">{job.client_email}</p>}
                {job.client_phone && <p className="text-slate-500">{job.client_phone}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dates</h3>
              <div className="space-y-1.5 text-sm">
                {job.scheduled_date && (
                  <p className="text-slate-600">Scheduled: <span className="font-semibold text-slate-900">{fmt(job.scheduled_date)}</span></p>
                )}
                {completion?.completed_at && (
                  <p className="text-slate-600">Completed: <span className="font-semibold text-slate-900">{fmt(completion.completed_at)}</span></p>
                )}
                {completion?.operative_name && (
                  <p className="text-slate-600">Operative: <span className="font-semibold text-slate-900">{completion.operative_name}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice totals */}
          {invoice && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-2.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Summary</h3>
              </div>
              <div className="p-5 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Net amount</span>
                  <span className="font-semibold text-slate-900">£{invoice.net_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">VAT ({(invoice.vat_rate * 100).toFixed(0)}%)</span>
                  <span className="font-semibold text-slate-900">£{invoice.vat_amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-[#ea580c] px-5 py-3">
                <span className="font-bold text-white">Total</span>
                <span className="font-black text-white text-lg">£{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Satisfaction */}
          {completion && (
            <div className="grid grid-cols-2 gap-4">
              {completion.star_rating && (
                <div className="rounded-xl border border-slate-100 p-4 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rating</p>
                  <p className="text-xl font-mono text-amber-400">{stars(completion.star_rating)}</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{completion.star_rating}/5</p>
                </div>
              )}
              {completion.customer_satisfaction && (
                <div className="rounded-xl border border-slate-100 p-4 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Satisfaction</p>
                  <p className="text-sm font-bold text-slate-800 capitalize mt-2">{completion.customer_satisfaction}</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {completion?.feedback && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Feedback</p>
              <p className="text-sm text-slate-700 italic">&ldquo;{completion.feedback}&rdquo;</p>
            </div>
          )}

          {/* Signature */}
          {signatureUrl && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer Signature</p>
              <div className="border border-slate-200 rounded-xl p-3 inline-block bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signatureUrl} alt="Customer signature" className="h-24 object-contain" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{job.client_name} · {fmt(completion?.completed_at ?? null)}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            This certificate confirms that the above work has been completed to the satisfaction of the client.
          </p>
          <p className="text-xs text-slate-300 mt-1">Asbestos UK Teams · {new Date().toLocaleDateString("en-GB")}</p>
        </div>
      </div>
    </div>
  );
}
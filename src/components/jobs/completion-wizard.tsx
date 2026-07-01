"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { createClient } from "@/lib/supabase/client";
import { submitCompletion } from "@/app/(protected)/jobs/[id]/actions";
import type { Job, CustomerSatisfaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Invoice", description: "Review the invoice" },
  { label: "Signature", description: "Customer signature" },
  { label: "Satisfaction", description: "Customer satisfaction" },
  { label: "Rating", description: "Star rating" },
  { label: "Feedback", description: "Customer feedback" },
  { label: "Photos", description: "Completion photos" },
  { label: "Receipts", description: "Expense receipts" },
];

const SATISFACTION_OPTIONS: {
  value: CustomerSatisfaction;
  label: string;
  emoji: string;
  color: string;
  activeBg: string;
  activeRing: string;
}[] = [
  {
    value: "excellent",
    label: "Excellent",
    emoji: "😁",
    color: "border-emerald-300",
    activeBg: "bg-emerald-50",
    activeRing: "ring-2 ring-emerald-400 border-emerald-500",
  },
  {
    value: "good",
    label: "Good",
    emoji: "🙂",
    color: "border-sky-300",
    activeBg: "bg-sky-50",
    activeRing: "ring-2 ring-sky-400 border-sky-500",
  },
  {
    value: "satisfactory",
    label: "Satisfactory",
    emoji: "😐",
    color: "border-amber-300",
    activeBg: "bg-amber-50",
    activeRing: "ring-2 ring-amber-400 border-amber-500",
  },
  {
    value: "poor",
    label: "Poor",
    emoji: "😞",
    color: "border-red-300",
    activeBg: "bg-red-50",
    activeRing: "ring-2 ring-red-400 border-red-500",
  },
];

const STAR_LABELS = ["", "Needs improvement", "Below average", "Average", "Good work", "Excellent! ⭐"];

type WizardPhoto = { file: File; previewUrl: string };
type WizardReceipt = {
  file: File;
  previewUrl: string;
  amount: string;
  description: string;
  purchaseDate: string;
};

export function CompletionWizard({ job }: { job: Job }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [signature, setSignature] = useState("");
  const [satisfaction, setSatisfaction] = useState<CustomerSatisfaction | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [photos, setPhotos] = useState<WizardPhoto[]>([]);
  const [receipts, setReceipts] = useState<WizardReceipt[]>([]);

  const sigPadRef = useRef<SignatureCanvas>(null);

  const netAmount = job.total_value ?? 0;
  const vatRate = 20;
  const vatAmount = netAmount * (vatRate / 100);
  const totalAmount = netAmount + vatAmount;

  function canProceed() {
    if (step === 2) return satisfaction !== null;
    if (step === 3) return starRating > 0;
    if (step === 4) return feedback.trim().length >= 5;
    if (step === 5) return photos.length > 0;
    return true;
  }

  function captureAndAdvance() {
    if (step === 1 && sigPadRef.current && !sigPadRef.current.isEmpty()) {
      setSignature(sigPadRef.current.toDataURL("image/png"));
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) })),
    ]);
    e.target.value = "";
  }

  function handleAddReceiptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceipts((prev) => [
      ...prev,
      {
        file,
        previewUrl: URL.createObjectURL(file),
        amount: "",
        description: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      },
    ]);
    e.target.value = "";
  }

  function updateReceipt(
    i: number,
    field: keyof Omit<WizardReceipt, "file" | "previewUrl">,
    value: string
  ) {
    setReceipts((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const photoStoragePaths: string[] = [];
      for (const photo of photos) {
        const ext = photo.file.name.split(".").pop() ?? "jpg";
        const path = `${job.id}/completion-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("job-photos").upload(path, photo.file);
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        photoStoragePaths.push(path);
      }

      const receiptData: {
        storagePath: string;
        amount: number;
        description: string;
        purchaseDate: string;
      }[] = [];
      for (const receipt of receipts) {
        const ext = receipt.file.name.split(".").pop() ?? "jpg";
        const path = `${job.id}/receipt-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("job-photos").upload(path, receipt.file);
        if (error) throw new Error(`Receipt upload failed: ${error.message}`);
        receiptData.push({
          storagePath: path,
          amount: parseFloat(receipt.amount) || 0,
          description: receipt.description,
          purchaseDate: receipt.purchaseDate,
        });
      }

      const result = await submitCompletion({
        jobId: job.id,
        netAmount,
        vatRate,
        signature,
        satisfaction: satisfaction!,
        starRating,
        feedback,
        additionalComments,
        photoStoragePaths,
        receipts: receiptData,
      });

      if (result && "error" in result) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      setInvoiceNumber(result?.invoiceNumber ?? "");
      setDone(true);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setStep(0);
    setDone(false);
    setSubmitting(false);
  }

  function handleClose() {
    if (!done && step > 0) {
      if (!window.confirm("Exit wizard? Progress will be lost.")) return;
    }
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        onClick={handleOpen}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold gap-1.5"
      >
        <CheckCircleIcon />
        Complete Job &amp; Issue Invoice
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      {/* ─── Header ─── */}
      <div
        className="text-white px-4 pt-5 pb-0 sm:px-6 shadow-lg"
        style={{ background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Job Completion Wizard
            </p>
            <h2 className="font-bold text-xl leading-tight">{job.title}</h2>
            <p className="text-indigo-300 text-sm mt-0.5">{job.address}</p>
          </div>
          <button
            onClick={handleClose}
            className="mt-0.5 rounded-full w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-400",
                i < step ? "bg-white flex-1" : i === step ? "bg-white flex-[2]" : "bg-white/25 flex-1"
              )}
            />
          ))}
        </div>

        {/* Step label strip */}
        <div
          className="-mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5"
          style={{ background: "rgba(0,0,0,0.12)" }}
        >
          <p className="text-sm text-indigo-100">
            <span className="font-bold text-white">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="mx-2 text-indigo-300">·</span>
            {STEPS[step].description}
          </p>
        </div>
      </div>

      {/* ─── Done screen ─── */}
      {done ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner"
            style={{ background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" }}
          >
            <span className="text-5xl">✅</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-2">All Done!</h3>
          {invoiceNumber && (
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-5 py-2.5 mb-4">
              <span className="text-indigo-700 font-bold text-lg">{invoiceNumber}</span>
              <span className="text-indigo-400 text-sm">generated</span>
            </div>
          )}
          <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">
            The job has been marked complete and the invoice has been issued successfully.
          </p>
          <Button
            onClick={() => setOpen(false)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-2.5 text-base font-semibold shadow-md"
          >
            Return to job
          </Button>
        </div>
      ) : (
        <>
          {/* ─── Step content ─── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto px-4 py-6 sm:px-6">

              {/* STEP 0 – Invoice Preview */}
              {step === 0 && (
                <div className="space-y-4">
                  <SectionHeading>Invoice Preview</SectionHeading>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div
                      className="px-6 py-5 text-white"
                      style={{ background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)" }}
                    >
                      <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
                        Tax Invoice
                      </p>
                      <p className="font-bold text-xl">{job.title}</p>
                      <p className="text-indigo-200 text-sm mt-0.5">{job.address}</p>
                    </div>
                    <div className="px-6 py-5 space-y-3">
                      <InfoRow label="Client" value={job.client_name} />
                      <InfoRow
                        label="Date"
                        value={new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}
                      />
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Net amount</span>
                          <span className="text-slate-800">£{netAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">VAT ({vatRate}%)</span>
                          <span className="text-slate-800">£{vatAmount.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-base">Total</span>
                          <span className="font-extrabold text-2xl text-indigo-600">
                            £{totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Invoice number is auto-assigned on submission.
                  </p>
                </div>
              )}

              {/* STEP 1 – Signature */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <SectionHeading>Customer Signature</SectionHeading>
                    <p className="text-sm text-slate-500 mt-1">
                      Ask the customer to sign below to confirm the work is complete.
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden relative">
                    <SignatureCanvas
                      ref={sigPadRef}
                      penColor="#312e81"
                      canvasProps={{
                        className: "w-full block",
                        style: { height: 230, touchAction: "none" },
                      }}
                    />
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                      <div className="w-2/3 h-px bg-slate-200" />
                    </div>
                    <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-slate-300 pointer-events-none">
                      Sign above
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sigPadRef.current?.clear()}
                      className="flex-1"
                    >
                      Clear signature
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSignature("");
                        setStep((s) => s + 1);
                      }}
                      className="flex-1 text-slate-400 hover:text-slate-600"
                    >
                      Skip (declined)
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2 – Customer Satisfaction */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <SectionHeading>Customer Satisfaction</SectionHeading>
                    <p className="text-sm text-slate-500 mt-1">
                      How satisfied is the customer with the completed work?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SATISFACTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSatisfaction(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer select-none",
                          satisfaction === opt.value
                            ? `${opt.activeBg} ${opt.activeRing}`
                            : `border-slate-200 bg-white hover:${opt.color} hover:${opt.activeBg}`
                        )}
                      >
                        <span className="text-4xl">{opt.emoji}</span>
                        <span className="font-semibold text-sm text-slate-800">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3 – Star Rating */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <SectionHeading>Star Rating</SectionHeading>
                    <p className="text-sm text-slate-500 mt-1">
                      Rate the overall quality of work (1–5 stars).
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const lit = star <= (hoveredStar || starRating);
                        return (
                          <button
                            key={star}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setStarRating(star)}
                            className="transition-transform duration-100 hover:scale-125 focus:outline-none text-5xl leading-none"
                          >
                            <span className={lit ? "text-amber-400" : "text-slate-200"}>★</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-sm font-medium text-slate-500 min-h-[1.25rem]">
                      {STAR_LABELS[hoveredStar || starRating] ?? ""}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4 – Feedback */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <SectionHeading>Feedback</SectionHeading>
                    <p className="text-sm text-slate-500 mt-1">
                      Capture any comments or observations about the job.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Customer feedback <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="e.g. 'Great service, very professional and left the area tidy…'"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      {feedback.trim().length > 0 && feedback.trim().length < 5 && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter at least 5 characters
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Additional comments{" "}
                        <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <Textarea
                        placeholder="Any other notes from the visit…"
                        value={additionalComments}
                        onChange={(e) => setAdditionalComments(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5 – Photos */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <SectionHeading>Completion Photos</SectionHeading>
                    <p className="text-sm text-slate-500 mt-1">
                      Upload before &amp; after photos. At least one is required.
                    </p>
                  </div>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleAddPhotos}
                    />
                    <span className="text-4xl">📸</span>
                    <p className="font-semibold text-slate-700">Tap to add photos</p>
                    <p className="text-xs text-slate-400">JPG, PNG, HEIC · Multiple allowed</p>
                  </label>
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((p, i) => (
                        <div key={i} className="relative group aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.previewUrl}
                            alt="completion"
                            className="w-full h-full object-cover rounded-xl border border-slate-200"
                          />
                          <button
                            onClick={() =>
                              setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-red-400 font-medium">
                      At least 1 photo is required to proceed
                    </p>
                  )}
                </div>
              )}

              {/* STEP 6 – Receipts */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <SectionHeading>Expense Receipts</SectionHeading>
                    <p className="text-sm text-slate-500 mt-1">
                      Add any receipts for materials or expenses. Optional — skip if none.
                    </p>
                  </div>
                  {receipts.map((r, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">
                          Receipt {i + 1}
                        </span>
                        <button
                          onClick={() =>
                            setReceipts((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.previewUrl}
                          alt="receipt"
                          className="w-full h-36 object-cover rounded-xl border border-slate-200"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Amount (£)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={r.amount}
                              onChange={(e) => updateReceipt(i, "amount", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Date
                            </label>
                            <Input
                              type="date"
                              value={r.purchaseDate}
                              onChange={(e) => updateReceipt(i, "purchaseDate", e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Description
                          </label>
                          <Input
                            placeholder="What was purchased?"
                            value={r.description}
                            onChange={(e) => updateReceipt(i, "description", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <label className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl p-5 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAddReceiptFile}
                    />
                    <span className="text-3xl">🧾</span>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">Add receipt photo</p>
                      <p className="text-xs text-slate-400">Tap to upload</p>
                    </div>
                  </label>
                  {receipts.length === 0 && (
                    <p className="text-center text-xs text-slate-400">
                      No receipts added · You can skip this step
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── Footer Navigation ─── */}
          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
            <div className="max-w-lg mx-auto flex gap-3 items-center">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="shrink-0 font-medium"
                >
                  ← Back
                </Button>
              ) : (
                <div className="w-px" />
              )}
              <Button
                onClick={captureAndAdvance}
                disabled={!canProceed() || submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md disabled:opacity-40"
              >
                {step === STEPS.length - 1
                  ? submitting
                    ? "Submitting…"
                    : "Submit & Generate Invoice"
                  : "Continue →"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-slate-900">{children}</h3>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
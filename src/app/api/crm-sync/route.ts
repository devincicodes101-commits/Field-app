import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// POST /api/crm-sync
// Called by the CRM when a job is confirmed/booked.
// Requires Authorization: Bearer <CRM_SYNC_SECRET>

const ASSIGNMENT_TYPES = ["operative", "contractor", "auction"] as const;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRM_SYNC_SECRET;
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  for (const field of ["title", "address", "client_name"]) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  // Validate optional numeric / date inputs
  let totalValue: number | null = null;
  if (body.total_value != null && body.total_value !== "") {
    totalValue = Number(body.total_value);
    if (Number.isNaN(totalValue)) {
      return NextResponse.json({ error: "total_value must be a number" }, { status: 400 });
    }
  }
  let scheduledDate: string | null = null;
  if (body.scheduled_date) {
    const d = new Date(String(body.scheduled_date));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "scheduled_date is not a valid date" }, { status: 400 });
    }
    scheduledDate = d.toISOString();
  }

  // Assignment choice made in the CRM booking popup (defaults to internal operative)
  let assignmentType: (typeof ASSIGNMENT_TYPES)[number] = "operative";
  if (
    typeof body.assignment_type === "string" &&
    (ASSIGNMENT_TYPES as readonly string[]).includes(body.assignment_type)
  ) {
    assignmentType = body.assignment_type as (typeof ASSIGNMENT_TYPES)[number];
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Idempotency: if the CRM re-sends a job we've already stored, return the existing one.
  const externalRef = body.external_ref ? String(body.external_ref) : null;
  if (externalRef) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("external_ref", externalRef)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, job_id: existing.id, duplicate: true }, { status: 200 });
    }
  }

  const insert: Record<string, unknown> = {
    title: String(body.title),
    description: body.description ? String(body.description) : null,
    address: String(body.address),
    client_name: String(body.client_name),
    client_email: body.client_email ? String(body.client_email) : null,
    client_phone: body.client_phone ? String(body.client_phone) : null,
    total_value: totalValue,
    scheduled_date: scheduledDate,
    status: "accepted",
    assignment_type: assignmentType,
    external_ref: externalRef,
  };

  if (assignmentType === "contractor") {
    if (body.contractor_id) insert.contractor_id = String(body.contractor_id);
    if (body.contractor_percentage != null && body.contractor_percentage !== "") {
      const pct = Number(body.contractor_percentage);
      if (!Number.isNaN(pct)) insert.contractor_percentage = pct;
    }
  } else if (assignmentType === "auction") {
    const startBid = body.auction_start_bid != null ? Number(body.auction_start_bid) : NaN;
    insert.auction_start_bid = Number.isNaN(startBid) ? null : startBid;
    insert.auction_ends_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  }

  const { data, error } = await supabase.from("jobs").insert(insert).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job_id: data.id }, { status: 201 });
}

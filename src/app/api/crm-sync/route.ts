import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/crm-sync
// Called by the CRM when a job is confirmed/booked.
// Requires Authorization: Bearer <CRM_SYNC_SECRET>
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRM_SYNC_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["title", "address", "client_name"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      address: String(body.address),
      client_name: String(body.client_name),
      client_email: body.client_email ? String(body.client_email) : null,
      client_phone: body.client_phone ? String(body.client_phone) : null,
      total_value: body.total_value ? Number(body.total_value) : null,
      scheduled_date: body.scheduled_date ? String(body.scheduled_date) : null,
      status: "accepted",
      assignment_type: "operative",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job_id: data.id }, { status: 201 });
}

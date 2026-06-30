import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { body } = await request.json();

  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, client_name")
    .eq("client_access_token", token)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const { error } = await supabase.from("job_messages").insert({
    job_id: job.id,
    sender_role: "client",
    sender_id: null,
    sender_name: job.client_name,
    body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

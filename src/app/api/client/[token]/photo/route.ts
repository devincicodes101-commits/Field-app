import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const formData = await request.formData();
  const file = formData.get("file");
  const caption = formData.get("caption");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("client_access_token", token)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  // Scope item 6: client photos are only meaningful once a quote is accepted.
  if (job.status === "quote_sent") {
    return NextResponse.json(
      { error: "Photos can be added once the quote is accepted" },
      { status: 403 }
    );
  }

  const path = `${job.id}/client-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(path, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("job_photos").insert({
    job_id: job.id,
    kind: "client_reference",
    uploaded_by: null,
    uploaded_by_name: "Client",
    storage_path: path,
    caption: typeof caption === "string" && caption ? caption : null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";
import { TrackingClient } from "./client";

type OperativeLocation = {
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  is_tracking: boolean;
  updated_at: string;
  profiles: { full_name: string; role: string } | null;
};

export default async function TrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/login");

  const isOffice = profile.role === "office";

  // Office sees all; field workers see only their own
  const locQuery = supabase
    .from("operative_locations")
    .select("user_id, latitude, longitude, is_tracking, updated_at, profiles(full_name, role)");

  const { data: locations } = isOffice
    ? await locQuery.order("updated_at", { ascending: false })
    : await locQuery.eq("user_id", user.id);

  return (
    <TrackingClient
      locations={(locations ?? []) as unknown as OperativeLocation[]}
      currentUserId={user.id}
      isOffice={isOffice}
    />
  );
}
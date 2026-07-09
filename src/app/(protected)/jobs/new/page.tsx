import { redirect } from "next/navigation";

// Job creation is managed by the CRM system — not available here.
export default function NewJobPage() {
  redirect("/jobs");
}
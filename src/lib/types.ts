export type UserRole = "office" | "contractor" | "operative" | "admin" | "telesales";

export type JobStatus =
  | "quote_sent"
  | "accepted"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MessageSenderRole = "office" | "client" | "contractor" | "operative";
export type PhotoKind = "client_reference" | "completion";
export type ExtraWorkStatus = "pending" | "approved" | "rejected";
export type CustomerSatisfaction = "excellent" | "good" | "satisfactory" | "poor";
export type ReceiptStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type CoverageType = "national" | "radius" | "postcode_list";

export type Contractor = {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  coverage_type: CoverageType | null;
  coverage_radius_miles: number | null;
  coverage_postcodes: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignmentType = "operative" | "contractor" | "auction";

export type Job = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_access_token: string;
  contractor_id: string | null;
  assigned_team: string | null;
  assignment_type: AssignmentType;
  contractor_percentage: number | null;
  auction_start_bid: number | null;
  auction_ends_at: string | null;
  external_ref: string | null;
  status: JobStatus;
  scheduled_date: string | null;
  quote_accepted_at: string | null;
  total_value: number | null;
  completed_at: string | null;
  completion_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type JobBid = {
  id: string;
  job_id: string;
  contractor_id: string;
  contractor_name: string;
  amount: number;
  created_at: string;
};

export type JobMessage = {
  id: string;
  job_id: string;
  sender_role: MessageSenderRole;
  sender_id: string | null;
  sender_name: string;
  body: string;
  created_at: string;
};

export type JobPhoto = {
  id: string;
  job_id: string;
  kind: PhotoKind;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type JobReschedule = {
  id: string;
  job_id: string;
  old_date: string | null;
  new_date: string;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
};

export type ExtraWorkRequest = {
  id: string;
  job_id: string;
  contractor_id: string;
  description: string;
  amount: number;
  status: ExtraWorkStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  job_id: string;
  invoice_number: string;
  net_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type JobCompletion = {
  id: string;
  job_id: string;
  invoice_id: string | null;
  completed_by: string | null;
  operative_name: string | null;
  customer_signature: string | null;
  customer_satisfaction: CustomerSatisfaction | null;
  star_rating: number | null;
  feedback: string | null;
  additional_comments: string | null;
  before_after_photos: string[];
  video_url: string | null;
  completed_at: string;
  created_at: string;
};

export type Receipt = {
  id: string;
  job_id: string;
  submitted_by: string | null;
  operative_name: string | null;
  storage_path: string;
  amount: number | null;
  description: string | null;
  purchase_date: string | null;
  status: ReceiptStatus;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  job_id: string;
  label: string;
  is_completed: boolean;
  notes: string | null;
  created_by: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  added_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceLog = {
  id: string;
  user_id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  early_leave: boolean;
  notes: string | null;
  created_at: string;
};

export type SiteCheckEvent = "check_in" | "check_out";

export type JobSiteCheck = {
  id: string;
  job_id: string;
  user_id: string;
  event_type: SiteCheckEvent;
  latitude: number | null;
  longitude: number | null;
  distance_from_site: number | null;
  confirmed_on_site: boolean;
  time_on_site_minutes: number | null;
  created_at: string;
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  quote_sent: "Quote sent",
  accepted: "Accepted",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

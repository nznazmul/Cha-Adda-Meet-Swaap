export type UserRole = "user" | "moderator" | "admin";
export type AccountStatus = "active" | "suspended" | "banned";
export type SwipeAction = "like" | "pass" | "superlike" | "tea_invite";
export type MatchStatus = "active" | "unmatched" | "blocked";
export type ReportCategory =
  | "harassment"
  | "inappropriate_photos"
  | "spam_scam"
  | "fake_profile"
  | "underage"
  | "threats"
  | "other";
export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";
export type NotificationType = "match" | "message" | "like" | "moderation" | "system";
export type SubscriptionTier = "free" | "plus" | "gold" | "platinum";

export interface ProfilePrompt {
  id: string;
  question: string;
  answer: string;
}

export interface Profile {
  id: string;
  unique_id?: string | null;
  display_name: string;
  date_of_birth: string; // ISO date YYYY-MM-DD (private)
  gender: "man" | "woman" | "nonbinary" | "other";
  orientation?: string | null;
  bio?: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  job_title?: string | null;
  education?: string | null;
  height_cm?: number | null;
  dating_intentions: string[];
  interests: string[];
  languages: string[];
  prompts?: ProfilePrompt[];
  email?: string | null;
  phone?: string | null;
  verified?: boolean;
  verified_until?: string | null;
  is_discoverable: boolean;
  profile_complete: boolean;
  account_status: AccountStatus;
  role: UserRole;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Public profile projection: explicitly excludes private fields like DOB,
 * email, GPS coordinates, account status internals, and sensitive flags.
 */
export interface PublicProfile {
  id: string;
  unique_id?: string | null;
  display_name: string;
  age: number; // calculated from DOB, never exposes raw birth date
  gender: "man" | "woman" | "nonbinary" | "other";
  orientation?: string | null;
  bio?: string | null;
  city: string;
  approx_distance_km?: number | null;
  job_title?: string | null;
  education?: string | null;
  height_cm?: number | null;
  dating_intentions: string[];
  interests: string[];
  languages: string[];
  prompts?: ProfilePrompt[];
  verified?: boolean;
  verified_until?: string | null;
  photos: ProfilePhoto[];
  primary_photo_url?: string;
}

export interface ProfilePreferences {
  user_id: string;
  min_age: number;
  max_age: number;
  preferred_genders: string[];
  max_distance_km: number;
  location_enabled: boolean;
}

export interface ProfilePhoto {
  id: string;
  user_id: string;
  storage_path: string;
  url: string;
  display_order: number;
  is_primary: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface Swipe {
  id: string;
  from_user_id: string;
  to_user_id: string;
  action: SwipeAction;
  created_at: string;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  created_at: string;
  unmatched_at?: string | null;
  unmatched_by?: string | null;
  // Hydrated helper properties:
  other_user?: PublicProfile;
  last_message?: Message | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type?: "text" | "voice" | "tea_invite" | "gif";
  voice_duration?: number;
  tea_venue?: string;
  tea_note?: string;
  created_at: string;
  read_at?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  message_id?: string | null;
  category: ReportCategory;
  description?: string | null;
  status: ReportStatus;
  moderator_id?: string | null;
  moderation_notes?: string | null;
  created_at: string;
  updated_at: string;
  // Hydrated for admin:
  reporter?: { display_name: string; id: string };
  reported_user?: { display_name: string; id: string; account_status: string };
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string;
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: "dark" | "light" | "system";
  notifications_matches: boolean;
  notifications_messages: boolean;
  notifications_likes: boolean;
  incognito_mode: boolean;
  show_online_status: boolean;
  show_distance: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: "active" | "canceled" | "expired";
  current_period_end?: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AdminAnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  completedProfiles: number;
  totalLikes: number;
  totalMatches: number;
  totalMessages: number;
  pendingReports: number;
  suspendedUsers: number;
  bannedUsers: number;
}

export interface PlatformSettings {
  min_age: number;
  max_photos: number;
  require_photo_to_discover: boolean;
  maintenance_mode: boolean;
  updated_at?: string;
  updated_by?: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  selfie_url: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  duration_preset?: string | null;
  user?: {
    id: string;
    display_name: string;
    city?: string;
    date_of_birth?: string;
    gender?: string;
    primary_photo_url?: string;
    unique_id?: string | null;
  };
}

export interface MeetingSpot {
  id: string;
  name: string;
  area: string;
  city: string;
  address?: string | null;
  tip?: string | null;
  google_maps_url?: string | null;
  image_url?: string | null;
  is_active: boolean;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

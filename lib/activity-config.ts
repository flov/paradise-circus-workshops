import type { LucideIcon } from "lucide-react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Copy,
  Link as LinkIcon,
  CalendarPlus,
} from "lucide-react";

export type ActivityBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "pink"
  | "purple"
  | "amber";

export const ACTIVITY_ACTION_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; badgeVariant: ActivityBadgeVariant }
> = {
  create: { label: "created", icon: Plus, badgeVariant: "default" },
  update: { label: "updated", icon: Pencil, badgeVariant: "secondary" },
  delete: { label: "deleted", icon: Trash2, badgeVariant: "destructive" },
  approve: { label: "approved", icon: CheckCircle, badgeVariant: "purple" },
  copy: { label: "copied to next week", icon: Copy, badgeVariant: "amber" },
  fill: { label: "filled gaps", icon: CalendarPlus, badgeVariant: "amber" },
  link: { label: "linked", icon: LinkIcon, badgeVariant: "pink" },
};

/** Action keys for filter dropdown, excluding "all" */
export const ACTIVITY_ACTION_FILTER_OPTIONS = Object.entries(
  ACTIVITY_ACTION_CONFIG,
).map(([value]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

/** Cursor for initial activity load (future date = fetch newest first) */
export const ACTIVITY_INITIAL_CURSOR = new Date("2099-01-01").toISOString();

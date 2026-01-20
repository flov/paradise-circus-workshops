/**
 * Type definitions derived from database schema and utility types
 */

import type { User, UserProp as SchemaUserProp, Prop } from "@/db/schema";

// UserProfile with normalized date fields (experienceStartDate as string for API responses)
export type UserProfile = Omit<User, 'experienceStartDate'> & {
  experienceStartDate?: string | null;
};

// UserProp with joined prop name (from getUserProps query)
// This extends the schema UserProp and adds propName from the joined props table
export interface UserProp extends SchemaUserProp {
  propName: string;
}

// Prop option for autocomplete (just id and name)
export type PropOption = Pick<Prop, 'id' | 'name'>;

// Form-specific type for profile creation/editing
export interface ProfileFormData {
  username: string;
  displayName?: string;
  bio?: string;
  instagramHandle?: string;
  isInstructor: boolean;
  performanceStyle?: string;
  availableForPerformances: boolean;
  location?: string;
  youtubeVideos?: string;
  vimeoVideos?: string;
  props?: Array<{
    propName: string;
    skillLevel: number;
  }>;
}

// Utility type for validation results
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

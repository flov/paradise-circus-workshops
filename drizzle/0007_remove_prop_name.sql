-- Drop prop_name column from user_props table
-- This completes the normalization migration started in 0006
-- All prop names should now come from the props table via prop_id foreign key
ALTER TABLE "user_props" DROP COLUMN IF EXISTS "prop_name";

-- C50 P1 expand-only. Existing profiles remain NULL; never infer from a name.
-- Rollback application code only: retain column/type and parent-entered values.
CREATE TYPE "ChildGender" AS ENUM ('boy', 'girl');
ALTER TABLE "child_profiles" ADD COLUMN "gender" "ChildGender";

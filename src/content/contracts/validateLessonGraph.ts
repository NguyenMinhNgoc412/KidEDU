import { activitySchemaV1, type ActivityV1 } from "./activity";
import { lessonSchemaV1, type LessonV1 } from "./lesson";
import { targetSchemaV1, type TargetV1 } from "./target";

export type LessonGraphIssue = { path: string; message: string };
export type LessonGraphValidation =
  | { ok: true; lesson: LessonV1; activities: ActivityV1[]; targets: TargetV1[] }
  | { ok: false; issues: LessonGraphIssue[] };

/** Structural content check only. Asset QA, signatures and entitlement are separate gates. */
export function validatePublishedLessonGraph(input: {
  lesson: unknown;
  activities: unknown[];
  targets: unknown[];
}): LessonGraphValidation {
  if (!input || typeof input !== "object") {
    return { ok: false, issues: [{ path: "", message: "Expected lesson graph object" }] };
  }
  if (!Array.isArray(input.activities) || !Array.isArray(input.targets)) {
    return {
      ok: false,
      issues: [
        ...(!Array.isArray(input.activities)
          ? [{ path: "activities", message: "Expected activity array" }]
          : []),
        ...(!Array.isArray(input.targets)
          ? [{ path: "targets", message: "Expected target array" }]
          : [])
      ]
    };
  }
  const issues: LessonGraphIssue[] = [];
  const lessonResult = lessonSchemaV1.safeParse(input.lesson);
  const activityResults = input.activities.map((value) => activitySchemaV1.safeParse(value));
  const targetResults = input.targets.map((value) => targetSchemaV1.safeParse(value));

  if (!lessonResult.success) {
    issues.push(
      ...lessonResult.error.issues.map((issue) => ({
        path: `lesson.${issue.path.join(".")}`,
        message: issue.message
      }))
    );
  }
  activityResults.forEach((result, index) => {
    if (!result.success) {
      issues.push(
        ...result.error.issues.map((issue) => ({
          path: `activities.${index}.${issue.path.join(".")}`,
          message: issue.message
        }))
      );
    }
  });
  targetResults.forEach((result, index) => {
    if (!result.success) {
      issues.push(
        ...result.error.issues.map((issue) => ({
          path: `targets.${index}.${issue.path.join(".")}`,
          message: issue.message
        }))
      );
    }
  });
  if (issues.length > 0 || !lessonResult.success) return { ok: false, issues };

  const lesson = lessonResult.data;
  const activities = activityResults.flatMap((result) => (result.success ? [result.data] : []));
  const targets = targetResults.flatMap((result) => (result.success ? [result.data] : []));
  const activityKey = (activity: { id: string; version: number }) =>
    `${activity.id}:${activity.version}`;
  const activityMap = new Map<string, ActivityV1>();
  const targetMap = new Map<string, TargetV1>();

  for (const [index, activity] of activities.entries()) {
    const key = activityKey(activity);
    if (activityMap.has(key))
      issues.push({ path: `activities.${index}`, message: `Duplicate activity version ${key}` });
    activityMap.set(key, activity);
  }
  for (const [index, target] of targets.entries()) {
    const key = activityKey(target);
    if (targetMap.has(key))
      issues.push({ path: `targets.${index}`, message: `Duplicate target version ${key}` });
    targetMap.set(key, target);
  }
  if (lesson.status !== "published")
    issues.push({ path: "lesson.status", message: "Lesson must be published" });

  const selectedActivities: ActivityV1[] = [];
  for (const [index, ref] of lesson.activitySequence.entries()) {
    const activity = activityMap.get(activityKey(ref));
    const path = `lesson.activitySequence.${index}`;
    if (!activity) {
      issues.push({ path, message: `Missing activity version ${activityKey(ref)}` });
      continue;
    }
    if (activity.type !== ref.type)
      issues.push({ path, message: "Activity type does not match reference" });
    if (activity.status !== "published")
      issues.push({ path, message: "Activity must be published" });
    if (activity.goalId !== lesson.primaryGoalId && activity.goalId !== lesson.supportingGoalId) {
      issues.push({ path, message: "Activity goal is outside lesson goals" });
    }
    selectedActivities.push(activity);
  }

  const selectedTargets: TargetV1[] = [];
  const seenTargetIds = new Set<string>();
  for (const activity of selectedActivities) {
    for (const targetId of activity.targetIds) {
      const matchingTargets = targets.filter((target) => target.id === targetId);
      if (matchingTargets.length !== 1) {
        issues.push({
          path: `activities.${activity.id}.targetIds`,
          message: `Expected one target version for ${targetId}`
        });
        continue;
      }
      const target = matchingTargets[0]!;
      if (target.status !== "published")
        issues.push({ path: `targets.${targetId}.status`, message: "Target must be published" });
      if (!target.allowedActivityTypes.includes(activity.type)) {
        issues.push({
          path: `targets.${targetId}.allowedActivityTypes`,
          message: `Target does not allow ${activity.type}`
        });
      }
      if (!seenTargetIds.has(targetId)) {
        seenTargetIds.add(targetId);
        selectedTargets.push(target);
      }
    }
  }

  return issues.length
    ? { ok: false, issues }
    : { ok: true, lesson, activities: selectedActivities, targets: selectedTargets };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reject nullish, literal "undefined"/"null", and empty route param strings. */
export function isValidRouteId(id: string | null | undefined): id is string {
  if (id == null) return false;
  const trimmed = id.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return false;
  return true;
}

export function isValidCourseId(courseId: string | null | undefined): courseId is string {
  return isValidRouteId(courseId) && UUID_RE.test(courseId.trim());
}

export function isValidLessonId(lessonId: string | null | undefined): lessonId is string {
  return isValidRouteId(lessonId) && UUID_RE.test(lessonId.trim());
}

export function requireCourseId(courseId: string | null | undefined, context: string): string {
  if (!isValidCourseId(courseId)) {
    throw new Error(`[${context}] Invalid or missing courseId`);
  }
  return courseId;
}

export function requireLessonId(lessonId: string | null | undefined, context: string): string {
  if (!isValidLessonId(lessonId)) {
    throw new Error(`[${context}] Invalid or missing lessonId`);
  }
  return lessonId;
}

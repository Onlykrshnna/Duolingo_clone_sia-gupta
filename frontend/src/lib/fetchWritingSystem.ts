import { api, ApiError } from "@/lib/api";
import { isValidCourseId } from "@/lib/ids";
import { WritingSystemOverview } from "@/lib/types";

/** Fetch writing overview with one retry; returns null on 404 or invalid course id. */
export async function fetchWritingSystemForCourse(
  courseId: string
): Promise<{ overview: WritingSystemOverview | null; unavailable: boolean }> {
  if (!isValidCourseId(courseId)) {
    return { overview: null, unavailable: true };
  }

  try {
    const overview = await api.getWritingSystem(courseId, { retries: 1 });
    return { overview, unavailable: false };
  } catch (firstErr) {
    if (firstErr instanceof ApiError && firstErr.status === 404) {
      return { overview: null, unavailable: true };
    }
    try {
      const overview = await api.getWritingSystem(courseId, { retries: 0 });
      return { overview, unavailable: false };
    } catch (secondErr) {
      if (secondErr instanceof ApiError && secondErr.status === 404) {
        return { overview: null, unavailable: true };
      }
      throw firstErr;
    }
  }
}

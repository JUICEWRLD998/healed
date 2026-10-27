export class YouCamError extends Error {
  constructor(
    readonly code: string,
    readonly userMessage: string,
    detail?: string,
  ) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "YouCamError";
  }
}

// Codes seen live in Phase 1: error_face_not_forward_facing, error_large_face_angle, error_src_face_too_small,
// invalid_parameter, unknown_internal_error. The rest are matched by keyword and are UNVERIFIED against live responses.
const RULES: [RegExp, string][] = [
  [/small|below_min_image_size/, "The face is too small in the photo. Move closer so the face fills most of the frame."],
  [/not_forward|face_angle|angle|pose/, "The face is turned or tilted. Look straight at the camera and retake."],
  [/multiple|more_than_one|several/, "One face per consult. Retake with a single person in the frame."],
  [/no_face|face_not_found|no_face_detected|has_face/, "No face was found. Retake with the full face in view."],
  [/light|dark|bright|exposure/, "The lighting is too dark or too harsh. Retake in even, soft light."],
  [/nsfw|inappropriate|sensitive/, "This photo cannot be used. Retake a plain front-facing selfie."],
];

export function explain(code: string): string {
  const c = code.toLowerCase();
  for (const [re, msg] of RULES) if (re.test(c)) return msg;
  return "The analysis could not read this photo. Retake a clear, front-facing selfie in even light.";
}

export function fromApiError(code: string, message?: string): YouCamError {
  return new YouCamError(code, explain(code), message);
}

export function fromHttp(status: number, body?: string): YouCamError {
  if (status === 401 || status === 403)
    return new YouCamError(`http_${status}`, "The service key was rejected. Live analysis is unavailable right now.", body);
  if (status === 429) return new YouCamError("http_429", "Too many requests. Wait a few seconds and try again.", body);
  return new YouCamError(`http_${status}`, "The analysis service had a problem. Try again in a moment.", body);
}

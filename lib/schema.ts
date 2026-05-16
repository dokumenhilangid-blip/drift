import { z } from 'zod';

/**
 * Permissive coercion helpers for Gemini output. The AI sometimes returns:
 *   - null where a string is expected
 *   - a single string where an array is expected
 *   - missing fields entirely
 * Each field has a sensible fallback so validation rarely fails outright.
 */

const NullableString = z.preprocess(
  (v) => (v === null || v === undefined ? '' : v),
  z.string()
);

const StringArray = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return [];
    if (typeof v === 'string') return [v];
    if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : String(x)));
    return [];
  },
  z.array(z.string())
);

const OptionalString = z.preprocess(
  (v) => (v === null || v === undefined ? undefined : v),
  z.string().optional()
);

// Stage 1: Per-frame perception output
export const FramePerceptionSchema = z.object({
  frame_id: NullableString.default(''),
  timestamp_visible: NullableString.default('not_visible'),
  app_detected: NullableString.default('unknown'),
  screen_type: NullableString.default('unknown'),
  battery_level: OptionalString,
  network_signal: OptionalString,
  observable_artifacts: StringArray.default([]),
  ui_state_signals: StringArray.default([]),
  micro_behavior_inferred: NullableString.default('unknown'),
  emotional_undertone: NullableString.default('unknown'),
  one_line_mirror: NullableString.default(''),
});

export type FramePerception = z.infer<typeof FramePerceptionSchema>;

/**
 * Build a degraded but valid FramePerception when AI output is unparseable.
 * Frontend can render this without special-casing — it just looks "thin".
 */
export function buildFallbackPerception(
  frameIndex: number,
  rawTextSnippet?: string
): FramePerception {
  const snippet = (rawTextSnippet || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);

  return {
    frame_id: `f${frameIndex + 1}`,
    timestamp_visible: 'not_visible',
    app_detected: 'unknown',
    screen_type: 'unknown',
    observable_artifacts: [],
    ui_state_signals: [],
    micro_behavior_inferred: 'unknown',
    emotional_undertone: 'unknown',
    one_line_mirror:
      snippet || 'Gw nggak bisa baca screenshot ini dengan jelas. Coba yang lain.',
  };
}

// Session state stored client-side
export const SessionStateSchema = z.object({
  session_id: z.string(),
  created_at: z.string(),
  frames: z.array(FramePerceptionSchema),
  frame_count: z.number(),
});

export type SessionState = z.infer<typeof SessionStateSchema>;

// API request/response
export const PerceiveRequestSchema = z.object({
  image_base64: z.string(),
  frame_index: z.number(),
});

export const PerceiveResponseSchema = z.object({
  success: z.boolean(),
  perception: FramePerceptionSchema.optional(),
  degraded: z.boolean().optional(),
  parse_method: z.string().optional(),
  error: z.string().optional(),
});

export type PerceiveResponse = z.infer<typeof PerceiveResponseSchema>;

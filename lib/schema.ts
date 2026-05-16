import { z } from 'zod';

// Stage 1: Per-frame perception output
export const FramePerceptionSchema = z.object({
  frame_id: z.string(),
  timestamp_visible: z.string().describe('Time visible on screen UI, or "not_visible"'),
  app_detected: z.string().describe('App name detected from UI chrome'),
  screen_type: z.string().describe('e.g. feed, chat, settings, notification_panel, home_screen'),
  battery_level: z.string().optional().describe('Battery percentage if visible'),
  network_signal: z.string().optional(),
  observable_artifacts: z.array(z.string()).describe('Specific visible items: text, counts, names, content snippets'),
  ui_state_signals: z.array(z.string()).describe('Half-typed text, unread badges, mid-scroll position, notification banners'),
  micro_behavior_inferred: z.string().describe('What user was likely DOING based on UI state'),
  emotional_undertone: z.string().describe('Inferred emotional state from behavioral context, NOT from content mood'),
  one_line_mirror: z.string().describe('Single sentence acknowledgment in Indonesian informal, citing ONE specific artifact'),
});

export type FramePerception = z.infer<typeof FramePerceptionSchema>;

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
  error: z.string().optional(),
});

export type PerceiveResponse = z.infer<typeof PerceiveResponseSchema>;

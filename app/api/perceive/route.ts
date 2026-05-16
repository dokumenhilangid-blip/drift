import { NextRequest, NextResponse } from 'next/server';
import { PERCEIVE_SYSTEM_PROMPT, buildPerceiveUserPrompt } from '@/lib/prompts/perceive';
import { FramePerceptionSchema, buildFallbackPerception } from '@/lib/schema';
import { extractJSON, isTruncatedJSON } from '@/lib/json-extract';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const MAX_RETRIES = 1;
const FETCH_TIMEOUT_MS = 25_000;

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Build Gemini request body. Kept as function so retry can tweak params.
 */
function buildGeminiBody(
  imageBase64: string,
  frameIndex: number,
  isRetry: boolean
) {
  return {
    system_instruction: { parts: [{ text: PERCEIVE_SYSTEM_PROMPT }] },
    contents: [
      {
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: buildPerceiveUserPrompt(frameIndex) },
        ],
      },
    ],
    generationConfig: {
      temperature: isRetry ? 0.1 : 0.3,
      topP: 0.8,
      // Generous ceiling — typical response is ~400 tokens but truncation
      // happened at 1024. Set 2048 to guarantee headroom.
      maxOutputTokens: 2048,
      // Force raw JSON — no markdown wrapping, no streaming chunks.
      responseMimeType: 'application/json',
    },
  };
}

/**
 * Call Gemini with a timeout (AbortController). Returns raw text or null.
 */
async function callGemini(
  apiKey: string,
  imageBase64: string,
  frameIndex: number,
  isRetry: boolean
): Promise<{ rawText: string | null; finishReason: string | null; httpStatus: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGeminiBody(imageBase64, frameIndex, isRetry)),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[perceive] Gemini HTTP error', { status: res.status, body: errBody.slice(0, 300) });
      return { rawText: null, finishReason: null, httpStatus: res.status };
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    const finishReason = data?.candidates?.[0]?.finishReason ?? null;
    return { rawText, finishReason, httpStatus: res.status };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[perceive] Gemini fetch error', msg);
    return { rawText: null, finishReason: 'FETCH_ERROR', httpStatus: 0 };
  }
}

export async function POST(request: NextRequest) {
  let frameIndex = 0;

  try {
    const body = await request.json();
    const { image_base64 } = body;
    frameIndex = typeof body.frame_index === 'number' ? body.frame_index : 0;

    if (!image_base64 || typeof image_base64 !== 'string') {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[perceive] GEMINI_API_KEY not configured');
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: 'no-api-key',
        perception: buildFallbackPerception(frameIndex, 'GEMINI_API_KEY belum di-set di server.'),
      });
    }

    // First attempt
    let { rawText, finishReason, httpStatus } = await callGemini(apiKey, image_base64, frameIndex, false);

    // Detect truncation: finishReason === 'MAX_TOKENS' or JSON is visibly incomplete
    const wasTruncated = finishReason === 'MAX_TOKENS' || (rawText != null && isTruncatedJSON(rawText));

    if (wasTruncated && rawText) {
      console.warn('[perceive] Truncated response detected, retrying with higher tokens', {
        finishReason,
        rawTail: rawText.slice(-80),
      });
      // Retry once with lower temperature (more predictable = shorter)
      const retry = await callGemini(apiKey, image_base64, frameIndex, true);
      if (retry.rawText && !isTruncatedJSON(retry.rawText)) {
        rawText = retry.rawText;
        finishReason = retry.finishReason;
        httpStatus = retry.httpStatus;
      }
      // If retry also truncated, we'll try repair on original below.
    }

    // HTTP failure (no text at all)
    if (!rawText) {
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: httpStatus ? `http-${httpStatus}` : 'fetch-error',
        perception: buildFallbackPerception(frameIndex, 'AI lagi sibuk. Coba upload lagi.'),
      });
    }

    // Log raw (truncated for readability)
    console.log('[perceive] Raw Gemini text:', rawText.length > 600 ? rawText.slice(0, 600) + '...' : rawText);
    if (finishReason && finishReason !== 'STOP') {
      console.warn('[perceive] Non-STOP finishReason:', finishReason);
    }

    // Extract JSON (includes auto-repair for truncated output)
    const extracted = extractJSON(rawText);

    if (!extracted) {
      console.error('[perceive] All extraction strategies failed', {
        rawLength: rawText.length,
        rawHead: rawText.slice(0, 150),
        rawTail: rawText.slice(-80),
      });
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: 'extraction-failed',
        perception: buildFallbackPerception(frameIndex, rawText),
      });
    }

    // Ensure frame_id
    const candidate = extracted.data as Record<string, unknown>;
    if (!candidate.frame_id || typeof candidate.frame_id !== 'string') {
      candidate.frame_id = `f${frameIndex + 1}`;
    }

    // Validate
    const validated = FramePerceptionSchema.safeParse(candidate);

    if (!validated.success) {
      console.error('[perceive] Zod validation failed', {
        method: extracted.method,
        issues: validated.error.issues.slice(0, 3),
      });
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: `${extracted.method}-invalid`,
        perception: buildFallbackPerception(
          frameIndex,
          typeof candidate.one_line_mirror === 'string' ? candidate.one_line_mirror : rawText
        ),
      });
    }

    return NextResponse.json({
      success: true,
      degraded: extracted.method === 'repaired',
      parse_method: extracted.method,
      perception: validated.data,
    });
  } catch (error) {
    console.error('[perceive] Unhandled route error', error);
    return NextResponse.json({
      success: true,
      degraded: true,
      parse_method: 'route-exception',
      perception: buildFallbackPerception(frameIndex, 'Server error. Coba lagi.'),
    });
  }
}

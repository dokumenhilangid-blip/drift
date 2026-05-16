import { NextRequest, NextResponse } from 'next/server';
import { PERCEIVE_SYSTEM_PROMPT, buildPerceiveUserPrompt } from '@/lib/prompts/perceive';
import { FramePerceptionSchema, buildFallbackPerception } from '@/lib/schema';
import { extractJSON } from '@/lib/json-extract';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let frameIndex = 0;

  try {
    const body = await request.json();
    const { image_base64 } = body;
    frameIndex = typeof body.frame_index === 'number' ? body.frame_index : 0;

    if (!image_base64 || typeof image_base64 !== 'string') {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[perceive] GEMINI_API_KEY not configured');
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: 'no-api-key',
        perception: buildFallbackPerception(
          frameIndex,
          'GEMINI_API_KEY belum di-set di server.'
        ),
      });
    }

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: PERCEIVE_SYSTEM_PROMPT }] },
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image_base64,
                },
              },
              { text: buildPerceiveUserPrompt(frameIndex) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error('[perceive] Gemini HTTP error', {
        status: geminiResponse.status,
        body: errBody.slice(0, 500),
      });
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: `http-${geminiResponse.status}`,
        perception: buildFallbackPerception(
          frameIndex,
          'AI lagi sibuk. Coba upload screenshot lagi.'
        ),
      });
    }

    const data = await geminiResponse.json();
    const rawText: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error('[perceive] Empty Gemini response', {
        hasData: Boolean(data),
        keys: data ? Object.keys(data) : [],
        finishReason: data?.candidates?.[0]?.finishReason,
      });
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: 'empty-response',
        perception: buildFallbackPerception(frameIndex, 'AI nggak balas. Coba lagi.'),
      });
    }

    // Always log raw response (truncated) for production debugging.
    const rawSnippet = rawText.length > 800 ? rawText.slice(0, 800) + '\u2026' : rawText;
    console.log('[perceive] Raw Gemini text:', rawSnippet);

    const extracted = extractJSON(rawText);

    if (!extracted) {
      console.error('[perceive] All JSON extraction strategies failed', {
        rawLength: rawText.length,
        rawHead: rawText.slice(0, 200),
      });
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: 'extraction-failed',
        perception: buildFallbackPerception(frameIndex, rawText),
      });
    }

    const candidate = extracted.data as Record<string, unknown>;
    if (!candidate.frame_id || typeof candidate.frame_id !== 'string') {
      candidate.frame_id = `f${frameIndex + 1}`;
    }

    const validated = FramePerceptionSchema.safeParse(candidate);

    if (!validated.success) {
      console.error('[perceive] Zod validation failed after extraction', {
        method: extracted.method,
        issues: validated.error.issues,
        candidate,
      });
      return NextResponse.json({
        success: true,
        degraded: true,
        parse_method: `${extracted.method}-invalid`,
        perception: buildFallbackPerception(
          frameIndex,
          typeof candidate.one_line_mirror === 'string'
            ? candidate.one_line_mirror
            : rawText
        ),
      });
    }

    return NextResponse.json({
      success: true,
      degraded: false,
      parse_method: extracted.method,
      perception: validated.data,
    });
  } catch (error) {
    console.error('[perceive] Unhandled route error', error);
    return NextResponse.json({
      success: true,
      degraded: true,
      parse_method: 'route-exception',
      perception: buildFallbackPerception(
        frameIndex,
        'Server crash. Bukan lo. Coba lagi.'
      ),
    });
  }
}

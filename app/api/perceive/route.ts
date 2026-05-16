import { NextRequest, NextResponse } from 'next/server';
import { PERCEIVE_SYSTEM_PROMPT, buildPerceiveUserPrompt } from '@/lib/prompts/perceive';
import { FramePerceptionSchema } from '@/lib/schema';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { image_base64, frame_index } = await request.json();

    if (!image_base64) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: PERCEIVE_SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image_base64,
                },
              },
              {
                text: buildPerceiveUserPrompt(frame_index),
              },
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'AI perception failed' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Empty AI response' },
        { status: 502 }
      );
    }

    // Parse and validate with Zod
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON from AI' },
          { status: 502 }
        );
      }
    }

    const validated = FramePerceptionSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Validation failed:', validated.error.issues);
      // Return raw but tag as unvalidated
      return NextResponse.json({
        success: true,
        perception: { ...parsed as object, frame_id: `f${frame_index + 1}` },
        _unvalidated: true,
      });
    }

    return NextResponse.json({
      success: true,
      perception: validated.data,
    });
  } catch (error) {
    console.error('Perceive route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

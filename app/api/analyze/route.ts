import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_SYSTEM_PROMPT, FALLBACK_INSIGHT } from '@/lib/gemini-prompt';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const ANALYSIS_TIMEOUT = 8000; // 8 seconds

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { fallback: true, ...FALLBACK_INSIGHT },
        { status: 200 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type;

    // Call Gemini Vision API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: GEMINI_SYSTEM_PROMPT,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText);
        return NextResponse.json(
          { fallback: true, ...FALLBACK_INSIGHT },
          { status: 200 }
        );
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error('No content in Gemini response');
        return NextResponse.json(
          { fallback: true, ...FALLBACK_INSIGHT },
          { status: 200 }
        );
      }

      // Parse JSON response
      let insight;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        insight = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        return NextResponse.json(
          { fallback: true, ...FALLBACK_INSIGHT },
          { status: 200 }
        );
      }

      // Validate insight structure
      if (!insight.emotionalProfile || !insight.insights || !Array.isArray(insight.insights)) {
        console.error('Invalid insight structure');
        return NextResponse.json(
          { fallback: true, ...FALLBACK_INSIGHT },
          { status: 200 }
        );
      }

      return NextResponse.json(insight, { status: 200 });
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.error('Gemini API timeout');
      } else {
        console.error('Gemini API error:', error);
      }

      // Return beautiful fallback on any error
      return NextResponse.json(
        { fallback: true, ...FALLBACK_INSIGHT },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { fallback: true, ...FALLBACK_INSIGHT },
      { status: 200 }
    );
  }
}

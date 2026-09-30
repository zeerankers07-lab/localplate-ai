import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAIRequest } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    // ==========================================
    // AUTHENTICATION CHECK
    // ==========================================

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized. Please sign in first.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // REQUEST BODY
    // ==========================================

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const validation = validateAIRequest(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || "Invalid request.",
        },
        { status: 400 }
      );
    }

    const { message } = validation.data;

    // ==========================================
    // GROQ API KEY
    // ==========================================

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GROQ_API_KEY is missing.");

      return NextResponse.json(
        {
          error:
            "AI service is not configured. Please check the server environment.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // GROQ REQUEST
    // ==========================================

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",
              content:
                "You are LocalPlate AI, a helpful food and restaurant assistant.",
            },
            {
              role: "user",
              content: message,
            },
          ],

          temperature: 0.7,
        }),
      }
    );

    // ==========================================
    // GROQ RESPONSE
    // ==========================================

    let data: any;

    try {
      data = await response.json();
    } catch {
      console.error("Could not parse Groq response.");

      return NextResponse.json(
        {
          error: "Invalid response received from AI service.",
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error("Groq API Error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message || "Groq API request failed.",
        },
        { status: response.status }
      );
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply || typeof reply !== "string" || !reply.trim()) {
      return NextResponse.json(
        {
          error:
            "The AI service returned an empty response. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply: reply.trim(),
    });
  } catch (error) {
    console.error("Groq API Error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while connecting to Groq. Please try again.",
      },
      { status: 500 }
    );
  }
}
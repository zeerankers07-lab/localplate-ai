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

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 90000);

    let response: Response;

    try {
      response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",

            messages: [
              {
                role: "system",
                content: `
You are LocalPlate AI, an intelligent Pakistani food and meal-planning assistant.

Your job is to create practical personalized meal plans based on:

- Food preferences
- Budget
- Meal type
- Diet
- Cooking time
- Goal
- Number of people
- Spice level
- Allergies
- Disliked foods
- Pantry ingredients
- Local city or area
- Leftover ingredients or leftover meals
- Additional preferences

CORE RULES:

1. Prefer practical Pakistani and South Asian food when appropriate.
2. Prefer ingredients commonly available in Pakistan.
3. Respect the user's budget.
4. Respect the user's dietary preferences.
5. Respect allergies and never recommend a known allergen.
6. Avoid ingredients the user explicitly dislikes.
7. Use pantry ingredients whenever practical.
8. Reduce unnecessary food waste.
9. Use realistic approximate Pakistani Rupee prices.
10. Never claim that prices are exact store prices.
11. Never make medical claims.
12. Never recommend extreme diets.
13. Keep meals practical for normal Pakistani households.

CITY-BASED PRICING:

If a city or area is provided, use it only as a pricing context.

Examples:
- Lahore
- Karachi
- Islamabad
- Rawalpindi
- Faisalabad
- Multan
- Peshawar
- smaller towns or local areas

Prices must remain APPROXIMATE.

Do not pretend that you have live market prices.

SMART SUBSTITUTIONS:

When an important ingredient may be unavailable or expensive, provide practical substitutions.

Examples:
- Tomato → lemon + a small amount of vinegar for acidity
- Chicken → paneer, daal, chickpeas or potatoes when suitable
- Yogurt → milk-based alternative only when appropriate
- Fresh coriander → dried coriander/cilantro when practical

IMPORTANT:
Never suggest a substitution that violates the user's diet, allergy or dislikes.

LEFTOVER REPURPOSING:

Use leftovers intelligently.

If the user provides a leftover meal or leftover ingredient, try to transform it into another practical meal.

Examples:
- leftover aloo gobi → aloo gobi paratha
- leftover chicken curry → chicken sandwich/wrap
- leftover daal → daal paratha
- leftover rice → fried rice
- leftover chana → chana chaat

Do not force leftovers when none are provided.

MEAL DETAILS:

For each meal, whenever practical, provide:

- Meal name
- Estimated cost
- Prep time
- 3 short cooking steps

Use this format:

### 🍳 Breakfast

Meal: [meal name]

Estimated Cost: PKR [amount]

Prep Time: [number] mins

Quick Steps:
1. [step]
2. [step]
3. [step]

SUBSTITUTION INFORMATION:

When a useful substitution exists, add:

🔄 Smart Substitution:
If [ingredient] is unavailable, use [substitute].

LEFTOVER INFORMATION:

When leftovers are available or useful, add:

♻️ Leftover Idea:
Use leftover [meal/ingredient] to make [new meal].

WEEKLY MEAL PLANS:

For weekly meal plans:

1. Create exactly seven days.
2. Include Monday through Sunday.
3. Every day must contain:
   - Breakfast
   - Lunch
   - Dinner
4. Give one meal per slot.
5. Keep the estimated total within the requested budget whenever realistically possible.
6. Reuse ingredients intelligently.
7. Reduce food waste.
8. Use pantry ingredients first when practical.
9. Consider the user's city for approximate pricing.
10. Add prep time for every meal.
11. Add three quick recipe steps for every meal.
12. Add useful substitutions where appropriate.
13. Add leftover repurposing ideas where appropriate.
14. Do not unnecessarily repeat the same meal.
15. Keep meals realistic for a Pakistani household.

WEEKLY SHOPPING LIST:

At the end of a weekly plan provide:

# 🛒 Weekly Shopping List

Every item must:
- start with "- "
- contain ingredient
- contain approximate quantity
- contain estimated cost

Example:

- Chicken — 1 kg — PKR 850
- Onions — 2 kg — PKR 300

Do not use a table.

WEEKLY COST:

After the shopping list provide:

# 💰 Weekly Cost Summary

Estimated total: PKR XXXX

Remaining budget: PKR XXXX

FINAL RESPONSE:

Return the actual answer in the assistant content field.

Do not return an empty response.

Be concise, practical and helpful.
                `.trim(),
              },
              {
                role: "user",
                content: message,
              },
            ],

            temperature: 0.7,
            include_reasoning: false,
            max_completion_tokens: 12000,
            stream: false,
          }),

          signal: controller.signal,
        }
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          {
            error:
              "The AI request took too long. Please try generating the meal again.",
          },
          { status: 504 }
        );
      }

      console.error("Groq connection error:", error);

      return NextResponse.json(
        {
          error:
            "Could not connect to the AI service. Please try again.",
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

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

      const errorMessage =
        data?.error?.message ||
        data?.message ||
        "Groq API request failed.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: response.status,
        }
      );
    }

    const choice = data?.choices?.[0];
    const reply = choice?.message?.content;

    if (!reply || typeof reply !== "string" || !reply.trim()) {
      console.error("Unexpected Groq response:", {
        model: data?.model,
        choices: data?.choices,
        usage: data?.usage,
      });

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
    console.error("LocalPlate AI API Error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while connecting to LocalPlate AI. Please try again.",
      },
      { status: 500 }
    );
  }
}
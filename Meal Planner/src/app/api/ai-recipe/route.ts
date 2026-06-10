import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ingredients } = await req.json();

  const prompt = `You are a fun, enthusiastic family chef. Given these ingredients: ${ingredients.join(", ")}, suggest ONE creative and delicious meal.

Return ONLY valid JSON matching this exact structure:
{
  "title": "Recipe Name",
  "emoji": "🍳",
  "description": "One fun, enticing sentence about this dish.",
  "prep_time_mins": 10,
  "cook_time_mins": 20,
  "servings": 4,
  "difficulty": "easy",
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {"name": "ingredient name", "quantity": 200, "unit": "g", "emoji": "🥦"}
  ],
  "steps": [
    {"step": 1, "description": "What to do", "tip": "Optional fun tip (include tips for about half the steps)"}
  ]
}

Make it genuinely tasty, family-friendly, and achievable. Include 4-8 steps with encouraging, fun language. Add tips that make cooking feel easy and rewarding.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const recipe = JSON.parse(jsonMatch[0]);
    recipe.is_ai_generated = true;

    return NextResponse.json({ recipe });
  } catch (err) {
    console.error("AI recipe error:", err);
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 });
  }
}

// Read-only access to the meal plan built on the "What Can I Cook?" page.
// The Cook page stores its plan in localStorage; other pages use this helper
// to list the ingredients that plan still needs ("You May Need" sections).

export const COOK_PLAN_KEY = "localplate_cook_meal_plan";

function readListLines(body: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

// Reads one "**Label:**" section of a meal (until the next bold label).
function readSection(body: string, label: string) {
  const lines = body.split("\n");
  const startPattern = new RegExp(`^\\*\\*${label}:?\\*\\*:?`, "i");
  const start = lines.findIndex((line) => startPattern.test(line.trim()));

  if (start === -1) return "";

  const collected: string[] = [];
  const firstLine = lines[start].trim().replace(startPattern, "").trim();
  if (firstLine) collected.push(firstLine);

  for (let i = start + 1; i < lines.length; i++) {
    if (/^\*\*[^*]+\*\*/.test(lines[i].trim())) break;
    collected.push(lines[i]);
  }

  return collected.join("\n").trim();
}

// Unique missing ingredients across every meal in the Cook meal plan.
export function readCookPlanShoppingItems(): string[] {
  try {
    const raw = localStorage.getItem(COOK_PLAN_KEY);
    if (!raw) return [];

    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    const seen = new Set<string>();
    const items: string[] = [];

    list.forEach((meal) => {
      if (!meal || typeof meal.markdown !== "string") return;

      readListLines(readSection(meal.markdown, "You May Need")).forEach(
        (item) => {
          const key = item.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          items.push(item);
        }
      );
    });

    return items;
  } catch (error) {
    console.error("Could not read the Cook meal plan:", error);
    return [];
  }
}
// Safe hand-off of ingredients to the Shopping List page.
//
// Other pages (Cook, and later Planner / Weekly Plan) must NOT write straight
// into "localplate_shopping_list" - that would overwrite the user's existing
// list. Instead they drop raw lines into this inbox. The Shopping List page
// takes the inbox once it has finished loading and merges the lines into the
// existing list, skipping duplicates.

export const SHOPPING_INBOX_KEY = "localplate_shopping_inbox";

const MAX_INBOX_LINES = 200;
const MAX_LINE_LENGTH = 200;

function cleanLines(lines: unknown): string[] {
  if (!Array.isArray(lines)) return [];

  return lines
    .filter((line): line is string => typeof line === "string")
    .map((line) => line.trim().slice(0, MAX_LINE_LENGTH))
    .filter(Boolean);
}

// Adds lines to the inbox. Lines already waiting in the inbox are kept.
// Returns false if the browser storage could not be written.
export function pushToShoppingInbox(lines: string[]): boolean {
  try {
    const existing = cleanLines(
      JSON.parse(localStorage.getItem(SHOPPING_INBOX_KEY) || "[]")
    );

    const merged = [...existing, ...cleanLines(lines)].slice(
      0,
      MAX_INBOX_LINES
    );

    localStorage.setItem(SHOPPING_INBOX_KEY, JSON.stringify(merged));
    return true;
  } catch (error) {
    console.error("Could not write to the shopping inbox:", error);
    return false;
  }
}

// Reads the inbox and empties it in one step, so lines are never merged twice.
export function takeShoppingInbox(): string[] {
  try {
    const raw = localStorage.getItem(SHOPPING_INBOX_KEY);
    if (!raw) return [];

    localStorage.removeItem(SHOPPING_INBOX_KEY);
    return cleanLines(JSON.parse(raw));
  } catch (error) {
    console.error("Could not read the shopping inbox:", error);
    try {
      localStorage.removeItem(SHOPPING_INBOX_KEY);
    } catch {
      // ignore
    }
    return [];
  }
}
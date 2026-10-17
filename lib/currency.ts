// Everything that changes with the selected currency lives in this file, so
// the planner, weekly plan, shopping list, saved plans, home page and the AI
// prompts all agree on the symbol, the minimum price, the rounding, the usual
// budget and the food of each market.

import { getPriceGuide } from "./priceGuide";

export type CurrencyCode = "PKR" | "INR" | "USD";

export const CURRENCY_CODES: CurrencyCode[] = ["PKR", "INR", "USD"];

// What the app uses until the saved or detected currency has loaded.
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export type Market = {
  code: CurrencyCode;
  // Written in front of a price: "Rs. 850", "₹240", "$7.50".
  symbol: string;
  symbolSpace: boolean;
  country: string;
  demonym: string;
  // "Pakistani " / "Indian " / "" - goes in front of the word "food".
  foodAdj: string;
  currencyName: string;
  // Pricing rules shown to the AI and used when a price is cleaned up.
  smallestMoney: string;
  minPrice: number;
  priceStep: number;
  priceExample: number;
  // Quantities the AI should write.
  units: string;
  // Food.
  foodFocus: string;
  defaultFoodType: string;
  foodTypes: string[];
  weeklyFoodTypes: string[];
  // Budgets (whole numbers). defaultBudget is for one meal.
  defaultBudget: string;
  budgetPresets: string[];
  weeklyDefaultBudget: string;
  // Prompt examples.
  cityExamples: string[];
  substitutionExamples: string[];
  leftoverExamples: string[];
  shoppingExamples: string[];
};

export const MARKETS: Record<CurrencyCode, Market> = {
  PKR: {
    code: "PKR",
    symbol: "Rs.",
    symbolSpace: true,
    country: "Pakistan",
    demonym: "Pakistani",
    foodAdj: "Pakistani ",
    currencyName: "Pakistani Rupee (PKR)",
    smallestMoney: "the smallest note is Rs. 10",
    minPrice: 50,
    priceStep: 10,
    priceExample: 850,
    units: "g, kg, ml, l",
    foodFocus: "Pakistani and South Asian",
    defaultFoodType: "Pakistani",
    foodTypes: ["Pakistani", "Indian", "Any"],
    weeklyFoodTypes: ["Pakistani", "South Asian", "Mixed", "Vegetarian"],
    defaultBudget: "1000",
    budgetPresets: ["500", "1000", "2000"],
    weeklyDefaultBudget: "7000",
    cityExamples: [
      "Lahore",
      "Karachi",
      "Islamabad",
      "Rawalpindi",
      "Faisalabad",
      "Multan",
      "Peshawar",
      "smaller towns or local areas",
    ],
    substitutionExamples: [
      "Tomato → lemon + a small amount of vinegar for acidity",
      "Chicken → paneer, daal, chickpeas or potatoes when suitable",
      "Yogurt → milk-based alternative only when appropriate",
      "Fresh coriander → dried coriander when practical",
    ],
    leftoverExamples: [
      "leftover aloo gobi → aloo gobi paratha",
      "leftover chicken curry → chicken sandwich/wrap",
      "leftover daal → daal paratha",
      "leftover rice → fried rice",
      "leftover chana → chana chaat",
    ],
    shoppingExamples: [
      "Chicken — 1 kg — PKR 500",
      "Onions — 2 kg — PKR 380",
    ],
  },

  INR: {
    code: "INR",
    symbol: "₹",
    symbolSpace: false,
    country: "India",
    demonym: "Indian",
    foodAdj: "Indian ",
    currencyName: "Indian Rupee (INR)",
    smallestMoney: "the smallest note is ₹10",
    minPrice: 10,
    priceStep: 5,
    priceExample: 240,
    units: "g, kg, ml, l",
    foodFocus: "Indian",
    defaultFoodType: "Indian",
    foodTypes: ["Indian", "Pakistani", "Any"],
    weeklyFoodTypes: ["Indian", "South Asian", "Mixed", "Vegetarian"],
    defaultBudget: "400",
    budgetPresets: ["200", "400", "800"],
    weeklyDefaultBudget: "2800",
    cityExamples: [
      "Delhi",
      "Mumbai",
      "Bengaluru",
      "Hyderabad",
      "Chennai",
      "Kolkata",
      "Pune",
      "Ahmedabad",
      "smaller towns or local areas",
    ],
    substitutionExamples: [
      "Tomato → tamarind or a little lemon juice for tang",
      "Chicken → paneer, soya chunks, dal, rajma or chickpeas when suitable",
      "Curd → buttermilk or another suitable yogurt only when appropriate",
      "Fresh coriander → dried coriander powder or mint when practical",
    ],
    leftoverExamples: [
      "leftover aloo gobi → aloo gobi paratha",
      "leftover chicken curry → chicken wrap or roll",
      "leftover dal → dal paratha or dal khichdi",
      "leftover rice → lemon rice or vegetable fried rice",
      "leftover chole → chole chaat",
    ],
    shoppingExamples: [
      "Chicken — 1 kg — INR 240",
      "Onions — 2 kg — INR 100",
    ],
  },

  USD: {
    code: "USD",
    symbol: "$",
    symbolSpace: false,
    country: "the USA",
    demonym: "American",
    foodAdj: "",
    currencyName: "US Dollar (USD)",
    smallestMoney: "the smallest bill is $1",
    minPrice: 0.5,
    priceStep: 0.25,
    priceExample: 7.5,
    units: "lb, oz, cups, tbsp, tsp",
    foodFocus: "everyday American",
    defaultFoodType: "American",
    foodTypes: ["American", "Indian", "Pakistani", "Any"],
    weeklyFoodTypes: ["American", "South Asian", "Mixed", "Vegetarian"],
    defaultBudget: "20",
    budgetPresets: ["10", "20", "40"],
    weeklyDefaultBudget: "140",
    cityExamples: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Seattle",
      "smaller towns or rural areas",
    ],
    substitutionExamples: [
      "Chicken breast → chickpeas, lentils, tofu or eggs when suitable",
      "Fresh herbs → dried herbs when practical",
      "Sour cream → plain yogurt only when appropriate",
      "Fresh tomatoes → canned diced tomatoes",
    ],
    leftoverExamples: [
      "leftover roast chicken → chicken salad sandwich or wrap",
      "leftover rice → vegetable fried rice",
      "leftover pasta → baked pasta or frittata",
      "leftover chili → chili-stuffed baked potatoes",
      "leftover roasted vegetables → omelet or grain bowl",
    ],
    shoppingExamples: [
      "Chicken breast — 2 lb — USD 8.40",
      "Eggs — 1 dozen — USD 2.25",
    ],
  },
};

// =========================
// Formatting
// =========================

// "Rs. " | "₹" | "$" - ready to put in front of a number.
export function symbolPrefix(code: CurrencyCode): string {
  const market = MARKETS[code];

  return `${market.symbol}${market.symbolSpace ? " " : ""}`;
}

// Whole amounts have no decimals ("$20"); anything else has two ("$7.50").
export function formatAmount(amount: number, code: CurrencyCode): string {
  const cents = Math.round(amount * 100);
  const whole = cents % 100 === 0;

  const text = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `${symbolPrefix(code)}${text}`;
}

// A price template for prompts, e.g. moneyTemplate("USD", "XXX") -> "$XXX".
export function moneyTemplate(code: CurrencyCode, placeholder: string): string {
  return `${symbolPrefix(code)}${placeholder}`;
}

// The smallest realistic price for one item, rounded to the market's step.
export function roundPrice(value: number, code: CurrencyCode): number {
  const { minPrice, priceStep } = MARKETS[code];
  const stepped = Math.round(value / priceStep) * priceStep;

  return Math.max(minPrice, Math.round(stepped * 100) / 100);
}

// The pricing rule given to the AI for each market.
export function priceRule(code: CurrencyCode): string {
  const market = MARKETS[code];

  return `Use realistic approximate ${market.currencyName} prices for ${market.country}. Never estimate any single ingredient below ${formatAmount(
    market.minPrice,
    code
  )} (${market.smallestMoney}) and round every price to the nearest ${formatAmount(
    market.priceStep,
    code
  )}.`;
}

// Rules that keep the AI's prices honest. Added to every prompt that writes
// prices. A missing price is fine: customers add their own in the app.
export function priceAccuracyRules(code: CurrencyCode): string {
  const market = MARKETS[code];
  const guide = getPriceGuide(code);

  return `PRICE ACCURACY (very important):
- A price must match the exact quantity written next to it. Work it out from the unit price: 4 eggs cost 4/12 of a dozen, not the price of a whole dozen, and 250 g costs a quarter of the per-kg price.
- Typical shop prices in ${market.country} (${guide.label}). Use them for these items and stay close to them:
${guide.lines.map((line) => `  - ${line}`).join("\n")}${guide.note}
- Only write a price when you are reasonably sure of a realistic price for that exact quantity. If you are not sure (an unusual, branded, imported or seasonal item, or an unclear quantity), leave the price out of that item completely. Do not guess, and do not write a placeholder such as "N/A" or "varies". Customers add missing prices themselves in the app.
- A meal cost and any total count only the items that have a price. If a meal cannot be priced at all, leave out its cost line instead of guessing.`;
}

// =========================
// Reading prices back out of AI text
// =========================

// Any of the symbols or codes the AI may write in front of a price.
export const PRICE_PREFIX = String.raw`(?:Rs\.?|PKR|INR|USD|₹|₨|\$)`;

// A number such as 850, 1,200 or 7.50 (one capture group).
export const PRICE_AMOUNT = String.raw`([\d,]+(?:\.\d+)?)`;

export function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;

  const value = Number(raw.replace(/,/g, ""));

  return Number.isFinite(value) ? value : null;
}

// Works out which currency a plan was written in. Returns null when the text
// has no priced item. Plans saved before multi-currency use "Rs." / "PKR".
export function detectCurrencyFromText(text: string): CurrencyCode | null {
  if (!text) return null;

  const inr = (text.match(/₹|\bINR\b/gi) || []).length;
  const usd = (text.match(/\bUSD\b|\$\s?\d/gi) || []).length;
  const pkr = (text.match(/\bPKR\b|₨|\bRs\.?\s?\d/gi) || []).length;

  const best = Math.max(inr, usd, pkr);

  if (best === 0) return null;
  if (inr === best) return "INR";
  if (usd === best) return "USD";

  return "PKR";
}
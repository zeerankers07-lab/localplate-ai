// Reference shop prices used by the AI prompts (see priceAccuracyRules in
// lib/currency.ts).
//
// HOW TO UPDATE EVERY MONTH
// 1. Copy the newest block of a market below, paste it under the same market
//    and change `month` to the new month ("2026-11"), then edit the prices.
// 2. That is all. The app always uses the newest block whose month is not in
//    the future, so nothing else has to change.
//
// Sources (October 2026):
// - Pakistan: Pakistan Bureau of Statistics weekly SPI, week ended 8 Oct 2026
// - India: Department of Consumer Affairs retail prices and NECC egg rates
// - USA: Bureau of Labor Statistics average prices, August 2026
//
// If nobody adds a new block, the app does not pretend the old prices are
// fresh: after one month it tells the AI the guide is older and may be too
// low, and after three months it tells the AI to leave uncertain prices out.

type CurrencyCode = "PKR" | "INR" | "USD";

export type PriceSnapshot = {
  // "YYYY-MM" - the month these prices were checked.
  month: string;
  lines: string[];
};

export const PRICE_SNAPSHOTS: Record<CurrencyCode, PriceSnapshot[]> = {
  PKR: [
    {
      month: "2026-10",
      lines: [
          "Eggs (farm): Rs. 25–35 each (about Rs. 300–420 per dozen)",
          "Chicken (broiler, with bone): Rs. 420–600 per kg; boneless costs clearly more",
          "Fresh milk: Rs. 200–240 per litre",
          "Wheat flour (atta): Rs. 140–160 per kg",
          "Rice (basmati): Rs. 220–350 per kg depending on quality",
          "Sugar: Rs. 150–180 per kg",
          "Onions: Rs. 130–220 per kg",
          "Tomatoes: Rs. 120–180 per kg",
          "Potatoes: Rs. 60–90 per kg",
          "Daal per kg: chana Rs. 280–300, masoor Rs. 260–270, moong about Rs. 350, mash about Rs. 460",
          "Cooking oil: Rs. 300–320 per litre",
      ],
    },
  ],
  INR: [
    {
      month: "2026-10",
      lines: [
          "Eggs: ₹6–8 each (about ₹70–95 per dozen)",
          "Chicken (broiler): ₹200–280 per kg",
          "Milk: ₹56–65 per litre",
          "Wheat flour (atta): ₹38–45 per kg",
          "Rice: ₹45–60 per kg",
          "Onions: ₹40–60 per kg",
          "Tomatoes: ₹35–60 per kg",
          "Potatoes: ₹20–30 per kg",
          "Dal per kg: toor ₹120–140, moong ₹110–130, masoor ₹90–100, chana dal ₹85–95",
      ],
    },
  ],
  USD: [
    {
      month: "2026-10",
      lines: [
          "Eggs (large, Grade A): about $2.25 per dozen (about $0.19 each)",
          "Chicken breast, boneless: about $4.20 per lb; whole chicken about $2.00 per lb; bone-in legs about $1.70 per lb",
          "Ground beef: about $6.90 per lb",
          "Whole milk: about $4.25 per gallon",
          "White bread: about $1.80 per 1 lb loaf",
          "White rice (long grain): about $1.10 per lb",
      ],
    },
  ],
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthIndex(month: string): number {
  const [year, mon] = month.split("-").map(Number);

  return year * 12 + (mon - 1);
}

function monthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);

  return `${MONTHS[mon - 1]} ${year}`;
}

export type PriceGuide = {
  label: string;
  lines: string[];
  // Extra text for the prompt when the guide is getting old ("" when fresh).
  note: string;
  monthsOld: number;
};

// The newest price block that is not dated in the future, plus how old it is.
export function getPriceGuide(
  code: CurrencyCode,
  now: Date = new Date()
): PriceGuide {
  const nowIndex = now.getFullYear() * 12 + now.getMonth();

  const snapshots = [...PRICE_SNAPSHOTS[code]].sort(
    (a, b) => monthIndex(b.month) - monthIndex(a.month)
  );

  const current =
    snapshots.find((snapshot) => monthIndex(snapshot.month) <= nowIndex) ||
    snapshots[snapshots.length - 1];

  const monthsOld = Math.max(0, nowIndex - monthIndex(current.month));

  let note = "";

  if (monthsOld >= 3) {
    note = `\n- These reference prices are ${monthsOld} months old and prices have moved since. Treat them only as a rough floor, expect today's prices to be higher, and leave out the price of any item you are not sure about.`;
  } else if (monthsOld >= 1) {
    note = `\n- These reference prices were checked ${monthsOld} month${
      monthsOld > 1 ? "s" : ""
    } ago. Prices usually rise a little over time, so stay at the upper half of each range.`;
  }

  return {
    label: monthLabel(current.month),
    lines: current.lines,
    note,
    monthsOld,
  };
}
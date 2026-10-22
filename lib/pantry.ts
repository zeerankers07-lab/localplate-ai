// Everyday ingredients shown as tap-to-add tiles (Cook page and home page).
// Names must match the "ing.*" translation keys.
export const PANTRY: { name: string; emoji: string }[] = [
  { name: "Chicken", emoji: "🍗" },
  { name: "Eggs", emoji: "🥚" },
  { name: "Rice", emoji: "🍚" },
  { name: "Potatoes", emoji: "🥔" },
  { name: "Onions", emoji: "🧅" },
  { name: "Tomatoes", emoji: "🍅" },
  { name: "Daal", emoji: "🍛" },
  { name: "Flour", emoji: "🌾" },
  { name: "Garlic", emoji: "🧄" },
  { name: "Spinach", emoji: "🥬" },
  { name: "Yogurt", emoji: "🥛" },
  { name: "Bread", emoji: "🍞" },
];

// Emoji for other ingredients people type (only emoji that show on
// Windows 10 and newer, so no empty boxes).
const EXTRA_EMOJI: Record<string, string> = {
  carrot: "🥕",
  beef: "🥩",
  mutton: "🍖",
  lamb: "🍖",
  fish: "🐟",
  shrimp: "🍤",
  paneer: "🧀",
  cheese: "🧀",
  milk: "🥛",
  cucumber: "🥒",
  lemon: "🍋",
  mushroom: "🍄",
  corn: "🌽",
  pasta: "🍝",
  noodle: "🍜",
  oat: "🥣",
  cabbage: "🥬",
  salt: "🧂",
  banana: "🍌",
  apple: "🍎",
  pea: "🌱",
  chickpea: "🌱",
  lentil: "🍛",
  daal: "🍛",
  pepper: "🌶️",
  chili: "🌶️",
  chilies: "🌶️",
  chilli: "🌶️",
  eggplant: "🍆",
  brinjal: "🍆",
  broccoli: "🥦",
  avocado: "🥑",
  coconut: "🥥",
  mango: "🥭",
  strawberry: "🍓",
  orange: "🍊",
  grape: "🍇",
  peanut: "🥜",
  almond: "🥜",
  honey: "🍯",
  sugar: "🍬",
  tea: "🍵",
  coffee: "☕",
};

function singular(word: string) {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function pantryEmoji(name: string) {
  const key = name.trim().toLowerCase();

  const tile = PANTRY.find((item) => item.name.toLowerCase() === key);
  if (tile) return tile.emoji;

  // "Green chilies" -> try the whole name, then each word.
  const words = [key, ...key.split(/\s+/)];

  for (const word of words) {
    const emoji = EXTRA_EMOJI[word] ?? EXTRA_EMOJI[singular(word)];
    if (emoji) return emoji;
  }

  return "🍴";
}
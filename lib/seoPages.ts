// Content for the public recipe-idea pages (/recipes and /recipes/[slug]).
// Every page is written by hand so it is useful on its own and unique.

export type RecipePage = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  short: string;
  intro: string[];
  time: string;
  serves: string;
  dish: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
  ideas: { name: string; text: string }[];
  cookWith: string[];
  related: string[];
};

// Change this date whenever you edit the content below.
export const RECIPES_UPDATED = "2026-10-14";

export const RECIPE_PAGES: RecipePage[] = [
  {
    slug: "chicken-and-rice",
    title: "What to Cook with Chicken and Rice: 5 Easy Ideas",
    h1: "What to cook with chicken and rice",
    description:
      "Chicken and rice dinner ideas for any budget: one-pot chicken pulao, fried rice, biryani-style rice and more, with a step-by-step pulao recipe.",
    short: "One-pot pulao, fried rice, biryani-style rice and more.",
    intro: [
      "Chicken and rice is one of the most flexible pairings in the kitchen. The two ingredients cook in the same pot, feed a family on a modest budget, and take well to spices from almost any cuisine.",
      "Below is a reliable one-pot chicken pulao, followed by four other ways to use the same two ingredients.",
    ],
    time: "About 55 minutes",
    serves: "4 people",
    dish: "One-pot chicken pulao",
    ingredients: [
      "500 g chicken pieces, bone-in",
      "2 cups basmati rice, rinsed and soaked for 30 minutes",
      "2 medium onions, thinly sliced",
      "1 tbsp ginger-garlic paste",
      "1/4 cup oil or ghee",
      "1 tsp cumin seeds",
      "4 cloves, 4 green cardamom pods, 1 small cinnamon stick and 1 bay leaf",
      "2 green chilies, slit",
      "1/4 cup plain yogurt (optional)",
      "1 to 1.5 tsp salt, adjusted to taste",
      "3 cups hot water",
    ],
    steps: [
      "Heat the oil in a heavy pot and fry the onions until deep golden.",
      "Add the cumin and whole spices and stir for 30 seconds until fragrant.",
      "Add the chicken and ginger-garlic paste. Cook on medium-high heat for 8 to 10 minutes, stirring, until the chicken is no longer pink on the outside.",
      "Stir in the yogurt, green chilies and salt, then cover and cook for 10 minutes so the chicken releases its juices.",
      "Pour in 3 cups of hot water and bring to a boil. Taste the liquid; it should be slightly salty.",
      "Drain the soaked rice and spread it over the chicken. Cook uncovered on high heat until the water has reduced to the level of the rice.",
      "Cover tightly, reduce the heat to the lowest setting and steam for 10 to 12 minutes. Switch off the heat and rest for 5 minutes.",
      "Fluff gently with a fork. Check that the chicken is cooked through (the thickest piece should reach at least 74 °C / 165 °F) before serving.",
    ],
    tips: [
      "Soaking basmati rice for 30 minutes helps the grains stay long and separate.",
      "Bone-in chicken gives more flavor than boneless in a one-pot dish. If you use boneless, shorten the browning step to about 5 minutes.",
      "Do not stir the rice once the lid is on; it breaks the grains.",
      "Cool leftovers quickly, refrigerate them within an hour and reheat until steaming hot.",
    ],
    ideas: [
      {
        name: "Chicken fried rice",
        text: "Use cold, day-old rice. Stir-fry diced chicken with garlic, then add the rice, an egg, spring onions and a splash of soy sauce.",
      },
      {
        name: "Chicken biryani shortcut",
        text: "Marinate the chicken in yogurt and spices, layer it with half-cooked rice and steam on low heat for about 20 minutes.",
      },
      {
        name: "Lemon-herb chicken and rice bowl",
        text: "Pan-sear seasoned chicken, slice it over plain rice and add cucumber, tomato and a yogurt-mint sauce.",
      },
      {
        name: "Chicken and rice soup",
        text: "Simmer chicken with onion, carrot, garlic and a handful of rice in stock for a light, filling meal.",
      },
    ],
    cookWith: ["Chicken", "Rice", "Onions", "Yogurt"],
    related: ["leftover-rice", "budget-family-meals", "quick-dinner-ideas"],
  },
  {
    slug: "egg-and-potato",
    title: "What to Cook with Eggs and Potatoes: Easy Dinner Ideas",
    h1: "What to cook with eggs and potatoes",
    description:
      "Simple egg and potato meals: aloo anda curry, a Spanish-style potato omelette, hash and more. Includes a full aloo anda curry recipe.",
    short: "Aloo anda curry, potato omelette, hash and more.",
    intro: [
      "Eggs and potatoes are cheap, filling and almost always in the house. Together they make everything from a quick breakfast to a proper curry for dinner.",
      "This page starts with aloo anda curry, a home-style favorite across South Asia, then lists other ideas for the same two ingredients.",
    ],
    time: "About 35 minutes",
    serves: "3 to 4 people",
    dish: "Aloo anda curry (potato and egg curry)",
    ingredients: [
      "4 eggs, hard-boiled and peeled",
      "3 medium potatoes, peeled and cut into cubes",
      "1 large onion, finely chopped",
      "2 tomatoes, chopped or pureed",
      "1 tsp ginger-garlic paste",
      "3 tbsp oil",
      "1/2 tsp turmeric",
      "1 tsp red chili powder, adjusted to taste",
      "1 tsp coriander powder",
      "1/2 tsp cumin seeds",
      "1 to 1.5 tsp salt",
      "1.5 cups hot water",
      "Fresh coriander to finish",
    ],
    steps: [
      "Make a few shallow cuts in each boiled egg and fry them in a little oil for 1 to 2 minutes until lightly golden. Set aside.",
      "In the same pan, heat the remaining oil and add the cumin seeds. When they sizzle, add the onion and cook until golden brown.",
      "Add the ginger-garlic paste and cook for 1 minute, then add the tomatoes with the turmeric, chili, coriander powder and salt. Cook, stirring, until the oil separates from the masala.",
      "Add the potato cubes and stir for 2 minutes to coat them in the masala.",
      "Pour in the hot water, cover and simmer for 12 to 15 minutes until the potatoes are tender.",
      "Add the eggs, simmer for 3 more minutes so they take up the flavor, and finish with fresh coriander.",
    ],
    tips: [
      "Frying the boiled eggs briefly gives them a better texture and helps the masala cling.",
      "Cut the potatoes into equal pieces so they cook evenly.",
      "For a thicker gravy, lightly mash one or two potato cubes into the sauce.",
      "Serve with roti, paratha or plain rice.",
    ],
    ideas: [
      {
        name: "Spanish-style potato omelette",
        text: "Slowly cook sliced potato and onion in oil until soft, mix with beaten eggs and cook in a pan until set on both sides.",
      },
      {
        name: "Potato and egg hash",
        text: "Pan-fry diced boiled potatoes until crisp, add onion and chili, then crack in eggs and cook until the whites set.",
      },
      {
        name: "Egg and potato sandwich filling",
        text: "Mash boiled potato and chopped boiled egg with salt, pepper and a little mustard or green chutney, and spread on bread.",
      },
      {
        name: "Masala omelette with potato",
        text: "Add thin fried potato slices, chopped onion, tomato and chili to beaten eggs and cook as an omelette.",
      },
    ],
    cookWith: ["Eggs", "Potatoes", "Onions", "Tomatoes"],
    related: ["quick-dinner-ideas", "budget-family-meals", "chicken-and-rice"],
  },
  {
    slug: "leftover-rice",
    title: "Leftover Rice Recipes: 5 Ways to Use Cold Rice",
    h1: "Leftover rice recipes",
    description:
      "Turn leftover rice into egg fried rice, masala rice, rice cutlets and more. Includes a quick egg fried rice recipe and food safety tips for cooked rice.",
    short: "Egg fried rice, masala rice, cutlets and more.",
    intro: [
      "Cold, day-old rice is actually better than fresh rice for many dishes, because the grains are drier and do not turn mushy in the pan.",
      "The one rule is safety: cooked rice should be cooled quickly and stored properly, which is explained in the tips below.",
    ],
    time: "About 15 minutes",
    serves: "2 to 3 people",
    dish: "Egg fried rice",
    ingredients: [
      "3 cups cold cooked rice",
      "2 eggs, beaten",
      "1 cup chopped mixed vegetables (carrot, peas, cabbage, capsicum)",
      "2 spring onions, sliced",
      "2 cloves garlic, minced",
      "2 tbsp oil",
      "2 tbsp soy sauce",
      "1/2 tsp black pepper",
      "Salt, only if needed",
    ],
    steps: [
      "Break up any clumps in the cold rice with your fingers.",
      "Heat 1 tbsp oil in a wide pan or wok over high heat. Scramble the eggs until just set, then move them to a plate.",
      "Add the remaining oil and the garlic and stir for 15 seconds, then add the vegetables and stir-fry for 2 to 3 minutes.",
      "Add the rice and toss on high heat for 3 minutes until it is hot and slightly crisp in places.",
      "Add the soy sauce and pepper, return the eggs and add the spring onions. Taste before adding salt, as soy sauce is already salty.",
      "Serve straight away.",
    ],
    tips: [
      "Cool freshly cooked rice within an hour: spread it on a tray, then refrigerate it in a shallow, covered container.",
      "Use refrigerated rice within a day and reheat it until it is steaming hot all the way through. Reheat it only once.",
      "Do not leave cooked rice at room temperature for long. Rice can carry bacteria whose toxins survive reheating.",
      "A wide pan and high heat keep the grains separate.",
    ],
    ideas: [
      {
        name: "Vegetable masala rice",
        text: "Fry onion, tomato and spices, add vegetables and a splash of water, then fold in the rice and heat it through.",
      },
      {
        name: "Rice cutlets",
        text: "Mix rice with mashed potato, chopped onion, chili and spices, shape into patties and shallow-fry.",
      },
      {
        name: "Rice kheer",
        text: "Simmer leftover rice in milk with sugar and cardamom until creamy for a quick dessert.",
      },
      {
        name: "Yogurt rice",
        text: "Mix rice with plain yogurt and salt, then add a tempering of cumin and green chili for a cooling meal.",
      },
    ],
    cookWith: ["Rice", "Eggs", "Onions"],
    related: ["chicken-and-rice", "egg-and-potato", "budget-family-meals"],
  },
  {
    slug: "budget-family-meals",
    title: "Budget Meal Ideas for Families: Cook More for Less",
    h1: "Budget meals for the family",
    description:
      "Practical budget meal ideas built on daal, rice, eggs and seasonal vegetables, with a one-pot khichdi recipe and tips to cut your food bill.",
    short: "Daal, rice, eggs and seasonal vegetables, plus saving tips.",
    intro: [
      "A low food budget does not have to mean boring meals. The cheapest dishes are usually built on pulses, grains, eggs and seasonal vegetables, with small amounts of meat used for flavor.",
      "Start with the khichdi below, then use the tips to plan a week of inexpensive, filling meals.",
    ],
    time: "About 30 minutes",
    serves: "4 people",
    dish: "Masoor daal khichdi (one pot)",
    ingredients: [
      "1 cup rice, rinsed",
      "1/2 cup masoor (red lentil) or moong daal, rinsed",
      "1 onion, sliced",
      "1 tomato, chopped",
      "2 tbsp oil or ghee",
      "1 tsp cumin seeds",
      "1/2 tsp turmeric",
      "1 tsp salt, adjusted to taste",
      "About 5 cups water",
      "Green chili and fresh coriander (optional)",
    ],
    steps: [
      "Heat the oil in a pot, add the cumin and then the onion. Cook until golden.",
      "Add the tomato, turmeric and salt and cook for 2 to 3 minutes until soft.",
      "Add the rinsed rice and daal and stir for a minute.",
      "Add 5 cups of water, bring to a boil, then cover and simmer on low heat for 20 to 25 minutes, stirring once or twice.",
      "Add a little hot water if it is too thick. It should be soft and porridge-like.",
      "Serve with yogurt, pickle or a fried egg.",
    ],
    tips: [
      "Buy rice, daal and flour in larger packs when you can; the cost per kilogram is usually lower.",
      "Choose vegetables that are in season; they are cheaper and fresher.",
      "Cook a double batch and turn the leftovers into a different meal the next day.",
      "Use meat in small amounts, for example a little chicken in a vegetable pulao, rather than as the whole dish.",
      "Plan the week's dinners before shopping and write a list, so you buy only what you will use.",
    ],
    ideas: [
      {
        name: "Daal chawal",
        text: "Plain tempered daal with rice is a complete, low-cost meal.",
      },
      {
        name: "Chana pulao",
        text: "Cook boiled chickpeas with rice, onion and whole spices.",
      },
      {
        name: "Egg curry",
        text: "Boiled eggs in an onion-tomato gravy stretch a few eggs across a whole family.",
      },
      {
        name: "Seasonal vegetable sabzi",
        text: "Cook one seasonal vegetable with onion, tomato and spices, and serve it with roti.",
      },
    ],
    cookWith: ["Rice", "Daal", "Onions", "Tomatoes"],
    related: ["leftover-rice", "egg-and-potato", "high-protein-vegetarian"],
  },
  {
    slug: "high-protein-vegetarian",
    title: "High-Protein Vegetarian Meals: Easy Ideas and a Chana Recipe",
    h1: "High-protein vegetarian meals",
    description:
      "Vegetarian meals rich in protein: chana masala, daal, paneer and eggs. Includes a simple chana masala recipe and a list of protein-rich foods.",
    short: "Chana, daal, paneer and eggs, with a simple chana masala.",
    intro: [
      "Plenty of vegetarian foods supply protein: pulses, chickpeas, paneer, yogurt, eggs (if you eat them) and soy products. Combining a pulse with a grain, such as daal with rice, makes a meal more filling and well rounded.",
      "As a rough guide, cooked lentils have about 9 g of protein per 100 g, cooked chickpeas about 8 g, paneer roughly 18 g, and one large egg about 6 g. Values vary by brand and preparation. This is general information, not medical advice.",
    ],
    time: "About 30 minutes",
    serves: "3 to 4 people",
    dish: "Chana masala",
    ingredients: [
      "2 cups cooked chickpeas (one drained can, or 3/4 cup dry chickpeas boiled until soft)",
      "1 large onion, finely chopped",
      "2 tomatoes, pureed",
      "1 tbsp ginger-garlic paste",
      "3 tbsp oil",
      "1 tsp cumin seeds",
      "1 tsp coriander powder",
      "1/2 tsp turmeric",
      "1 to 1.5 tsp red chili powder",
      "1 tsp garam masala or chana masala spice mix",
      "1 to 1.5 tsp salt",
      "1 cup water",
      "Fresh coriander and a squeeze of lemon",
    ],
    steps: [
      "Heat the oil, add the cumin seeds and, when they sizzle, add the onion. Cook until golden brown.",
      "Add the ginger-garlic paste and cook for 1 minute.",
      "Add the tomato puree, turmeric, chili, coriander powder and salt. Cook for 6 to 8 minutes until the oil separates from the masala.",
      "Add the chickpeas and 1 cup of water. Simmer, partly covered, for 12 to 15 minutes.",
      "Lightly mash a few chickpeas against the side of the pot to thicken the gravy.",
      "Stir in the garam masala, lemon juice and coriander, and serve hot.",
    ],
    tips: [
      "Pair chana with rice, roti or a yogurt raita for a complete meal.",
      "Dried chickpeas are cheaper than canned: soak them overnight and pressure-cook until soft.",
      "Add a handful of spinach at the end for extra vegetables.",
      "If you are changing your diet for a health reason, speak to a doctor or dietitian.",
    ],
    ideas: [
      {
        name: "Paneer bhurji",
        text: "Crumble paneer and cook it with onion, tomato, green chili and spices; serve with roti.",
      },
      {
        name: "Moong daal chilla",
        text: "Blend soaked moong daal into a batter with spices and cook it as savory pancakes.",
      },
      {
        name: "Rajma (kidney bean curry)",
        text: "Slow-cook kidney beans in an onion-tomato gravy and serve with rice.",
      },
      {
        name: "Masala scrambled eggs or tofu",
        text: "Cook beaten eggs or crumbled tofu with onion, tomato and spices for a fast, protein-rich meal.",
      },
    ],
    cookWith: ["Chickpeas", "Onions", "Tomatoes", "Yogurt"],
    related: ["budget-family-meals", "quick-dinner-ideas", "egg-and-potato"],
  },
  {
    slug: "quick-dinner-ideas",
    title: "Quick Dinner Ideas: Easy Meals in 15 to 20 Minutes",
    h1: "Quick dinner ideas",
    description:
      "Fast dinner ideas for busy evenings: egg bhurji, masala omelette, quick chicken stir-fry and more, with a 10-minute egg bhurji recipe.",
    short: "Egg bhurji, stir-fry, pasta and more in 15 minutes.",
    intro: [
      "On busy evenings the best dinner is one you can finish in about 15 minutes with ingredients already in the kitchen.",
      "Egg bhurji is the classic fast option in many homes. The other ideas below use the same trick of small pieces and high heat.",
    ],
    time: "About 10 minutes",
    serves: "2 people",
    dish: "Egg bhurji (spiced scrambled eggs)",
    ingredients: [
      "4 eggs",
      "1 small onion, finely chopped",
      "1 tomato, finely chopped",
      "1 to 2 green chilies, chopped",
      "1/2 tsp cumin seeds",
      "1/4 tsp turmeric",
      "1/2 tsp red chili powder (optional)",
      "2 tbsp oil",
      "Salt to taste",
      "Fresh coriander",
    ],
    steps: [
      "Beat the eggs with a pinch of salt.",
      "Heat the oil in a pan over medium heat, add the cumin and then the onion and green chilies. Cook for 2 to 3 minutes until the onion is soft.",
      "Add the tomato, turmeric and chili powder and cook for 2 minutes until the tomato breaks down.",
      "Pour in the eggs and keep stirring gently until just set but still soft.",
      "Finish with coriander and serve with roti, paratha or toast.",
    ],
    tips: [
      "Take the pan off the heat while the eggs still look slightly wet; they keep cooking in the heat of the pan.",
      "Chop everything small so it cooks quickly.",
      "Keep eggs, onions, tomatoes and bread or flour on hand for these emergency dinners.",
    ],
    ideas: [
      {
        name: "Quick chicken stir-fry",
        text: "Slice chicken thinly, cook it on high heat with garlic and vegetables, and season with soy sauce and pepper. Make sure the chicken is cooked through.",
      },
      {
        name: "Vegetable pasta",
        text: "Boil pasta and toss it with garlic, chopped vegetables, olive oil and chili flakes.",
      },
      {
        name: "Masala toast",
        text: "Fry a spiced onion-tomato mixture and spread it on toasted bread, topped with cheese if you like.",
      },
      {
        name: "Upgraded instant noodles",
        text: "Add an egg and a handful of vegetables to the noodles while they cook.",
      },
    ],
    cookWith: ["Eggs", "Onions", "Tomatoes"],
    related: ["egg-and-potato", "chicken-and-rice", "high-protein-vegetarian"],
  },
];

export function getRecipePage(slug: string) {
  return RECIPE_PAGES.find((page) => page.slug === slug);
}
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type Config, loadConfig } from '../backend/config.ts';
import { clearDatabase, type DB, openDatabase } from '../backend/db/db.ts';
import { createRecipesFacade } from '../backend/features/recipes/recipes.facade.ts';
import type { CreateRecipeDto } from '../shared/dto/recipe.ts';

interface Sample {
  title: string;
  tags: string[];
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  calories?: string;
  /** A hue for the generated thumbnail; none leaves the recipe without one. */
  hue?: number;
}

const SAMPLES: Sample[] = [
  {
    title: 'Spaghetti Carbonara',
    tags: ['Pasta', 'Italian', 'Quick'],
    description: 'The Roman classic: egg yolks, pecorino, guanciale and plenty of black pepper, no cream.',
    ingredients: ['400 g Spaghetti', '150 g Guanciale', '4 Eigelb', '60 g Pecorino', '1-2 TL Pfeffer', 'Salz'],
    instructions: [
      'Boil the pasta in salted water.',
      'Fry the guanciale until crisp.',
      'Whisk yolks with pecorino and pepper.',
      'Toss everything off the heat.',
    ],
    prepTime: 10,
    cookTime: 15,
    calories: '640 kcal',
    hue: 42,
  },
  {
    title: 'Minestrone',
    tags: ['Soup', 'Italian', 'Vegetarian'],
    description: 'A hearty vegetable soup with beans and small pasta.',
    ingredients: ['2 Karotten', '2 Stangen Sellerie', '1 Zwiebel', '400 g Bohnen', '100 g Ditalini', '1 l Brühe', '2 EL Olivenöl'],
    instructions: ['Sweat the vegetables in olive oil.', 'Add stock and beans and simmer for 20 minutes.', 'Cook the pasta in the soup.'],
    prepTime: 20,
    cookTime: 35,
    calories: '380 kcal',
    hue: 95,
  },
  {
    title: 'Shoyu Ramen',
    tags: ['Soup', 'Japanese'],
    description: 'Clear soy broth, springy noodles, a soft egg and spring onions.',
    ingredients: ['2 Portionen Ramen-Nudeln', '1 l Hühnerbrühe', '3 EL Sojasauce', '2 Eier', '2 Frühlingszwiebeln', '1 TL Sesamöl'],
    instructions: ['Soft-boil the eggs for 6½ minutes.', 'Season the broth with soy sauce.', 'Cook the noodles and assemble the bowls.'],
    prepTime: 15,
    cookTime: 20,
    hue: 20,
  },
  {
    title: 'Pad Thai',
    tags: ['Thai', 'Quick', 'Noodles'],
    description: 'Rice noodles with tamarind, egg, tofu and peanuts.',
    ingredients: ['200 g Reisnudeln', '150 g Tofu', '2 Eier', '3 EL Tamarindenpaste', '2 EL Fischsauce', '50 g Erdnüsse', '1 Limette'],
    instructions: ['Soak the noodles.', 'Fry tofu, then the eggs.', 'Add noodles and sauce and toss.', 'Serve with peanuts and lime.'],
    prepTime: 15,
    cookTime: 10,
    calories: '560 kcal',
    hue: 160,
  },
  {
    title: 'Shakshuka',
    tags: ['Breakfast', 'Vegetarian', 'Quick'],
    description: 'Eggs poached in a spiced tomato and pepper sauce.',
    ingredients: ['4 Eier', '800 g Tomaten', '1 Paprika', '1 Zwiebel', '2 Knoblauchzehen', '1 TL Kreuzkümmel', 'Petersilie'],
    instructions: ['Soften onion, pepper and garlic.', 'Add tomatoes and spices and reduce.', 'Crack in the eggs and cover until set.'],
    prepTime: 10,
    cookTime: 20,
    hue: 5,
  },
  {
    title: 'Chili sin Carne',
    tags: ['Vegetarian', 'Spicy', 'Meal prep'],
    description: 'Beans, lentils and smoky chipotle; better on the second day.',
    ingredients: ['400 g Kidneybohnen', '200 g rote Linsen', '1 Dose Mais', '2 Zwiebeln', '1-2 Chipotle', '1 EL Kakao', '800 g Tomaten'],
    instructions: ['Fry onions and spices.', 'Add everything else and simmer for 40 minutes.'],
    prepTime: 15,
    cookTime: 45,
  },
  {
    title: 'Butter Chicken',
    tags: ['Indian', 'Chicken'],
    description: 'Marinated chicken in a mild, buttery tomato sauce.',
    ingredients: ['600 g Hähnchenschenkel', '200 g Joghurt', '2 EL Garam Masala', '400 g Tomaten', '50 g Butter', '100 ml Sahne'],
    instructions: ['Marinate the chicken overnight.', 'Grill until charred.', 'Simmer in the sauce for 10 minutes.'],
    prepTime: 20,
    cookTime: 30,
    calories: '720 kcal',
    hue: 28,
  },
  {
    title: 'Kartoffelsalat',
    tags: ['German', 'Side', 'Vegetarian'],
    description: 'Swabian potato salad with stock and vinegar, no mayonnaise.',
    ingredients: ['1 kg festkochende Kartoffeln', '250 ml Brühe', '3 EL Essig', '1 Zwiebel', 'Schnittlauch', 'Salz', 'Pfeffer'],
    instructions: ['Boil and peel the potatoes.', 'Slice them warm and dress with hot stock and vinegar.', 'Let them soak for an hour.'],
    prepTime: 20,
    cookTime: 25,
  },
  {
    title: 'Lasagne al Forno',
    tags: ['Pasta', 'Italian', 'Oven'],
    description: 'Ragù, béchamel and fresh sheets, baked until bubbling.',
    ingredients: ['12 Lasagneplatten', '500 g Rinderhack', '700 g Passata', '1 l Milch', '80 g Butter', '80 g Mehl', '100 g Parmesan'],
    instructions: ['Cook the ragù for an hour.', 'Make the béchamel.', 'Layer and bake at 180 °C for 40 minutes.'],
    prepTime: 40,
    cookTime: 100,
    calories: '780 kcal',
    hue: 12,
  },
  {
    title: 'Greek Salad',
    tags: ['Salad', 'Vegetarian', 'Quick', 'Greek'],
    description: 'Tomatoes, cucumber, olives and a slab of feta.',
    ingredients: ['4 Tomaten', '1 Gurke', '1 rote Zwiebel', '100 g Oliven', '200 g Feta', '4 EL Olivenöl', 'Oregano'],
    instructions: ['Cut the vegetables in chunks.', 'Top with feta, oil and oregano.'],
    prepTime: 10,
    cookTime: 0,
    hue: 200,
  },
  {
    title: 'Pancakes',
    tags: ['Breakfast', 'Sweet'],
    description: 'Fluffy buttermilk pancakes.',
    ingredients: ['250 g Mehl', '2 Eier', '300 ml Buttermilch', '2 EL Zucker', '1 TL Backpulver', 'Butter'],
    instructions: ['Mix dry and wet separately, then combine briefly.', 'Fry small rounds in butter.'],
    prepTime: 10,
    cookTime: 15,
  },
  {
    title: 'Risotto ai Funghi',
    tags: ['Italian', 'Vegetarian', 'Rice'],
    description: 'Creamy risotto with porcini and parmesan.',
    ingredients: ['320 g Risottoreis', '30 g getrocknete Steinpilze', '1 l Brühe', '1 Zwiebel', '100 ml Weißwein', '50 g Parmesan', '30 g Butter'],
    instructions: ['Soak the porcini.', 'Toast the rice, deglaze with wine.', 'Add stock ladle by ladle.', 'Finish with butter and parmesan.'],
    prepTime: 10,
    cookTime: 30,
    hue: 35,
  },
  {
    title: 'Fish Tacos',
    tags: ['Mexican', 'Fish', 'Quick'],
    description: 'Crisp fish, cabbage slaw and lime crema in corn tortillas.',
    ingredients: ['400 g Kabeljau', '8 Maistortillas', '¼ Rotkohl', '100 g Schmand', '1 Limette', '1 TL Chili'],
    instructions: ['Season and fry the fish.', 'Toss the slaw.', 'Assemble with crema.'],
    prepTime: 15,
    cookTime: 10,
  },
  {
    title: 'Linsen-Dal',
    tags: ['Indian', 'Vegetarian', 'Meal prep'],
    description: 'Red lentils with ginger, turmeric and a tempering of cumin.',
    ingredients: ['250 g rote Linsen', '1 Dose Kokosmilch', '1 Stück Ingwer', '1 TL Kurkuma', '1 TL Kreuzkümmel', '1 Zwiebel'],
    instructions: ['Simmer lentils with turmeric.', 'Temper spices in oil.', 'Stir in coconut milk.'],
    prepTime: 10,
    cookTime: 25,
    hue: 48,
  },
  {
    title: 'Käsespätzle',
    tags: ['German', 'Vegetarian'],
    description: 'Spätzle layered with mountain cheese and crisp onions.',
    ingredients: ['400 g Mehl', '4 Eier', '200 g Bergkäse', '2 Zwiebeln', '30 g Butter'],
    instructions: ['Make the dough and scrape the spätzle into boiling water.', 'Layer with cheese.', 'Top with fried onions.'],
    prepTime: 20,
    cookTime: 20,
  },
  {
    title: 'Tom Kha Gai',
    tags: ['Thai', 'Soup', 'Chicken'],
    description: 'Coconut soup with galangal, lemongrass and lime leaves.',
    ingredients: ['400 ml Kokosmilch', '300 g Hähnchenbrust', '1 Stück Galgant', '2 Stangen Zitronengras', '4 Kaffirlimettenblätter', '2 EL Fischsauce'],
    instructions: ['Infuse the coconut milk with the aromatics.', 'Poach the chicken in it.', 'Season with fish sauce and lime.'],
    prepTime: 15,
    cookTime: 20,
    hue: 140,
  },
  {
    title: 'Banana Bread',
    tags: ['Baking', 'Sweet'],
    description: 'Moist loaf with very ripe bananas and walnuts.',
    ingredients: ['3 Bananen', '250 g Mehl', '100 g Zucker', '2 Eier', '80 g Butter', '1 TL Natron', '50 g Walnüsse'],
    instructions: ['Mash the bananas.', 'Fold everything together.', 'Bake at 175 °C for an hour.'],
    prepTime: 15,
    cookTime: 60,
  },
  {
    title: 'Gazpacho',
    tags: ['Soup', 'Spanish', 'Vegetarian', 'Cold'],
    description: 'Chilled tomato soup for hot days.',
    ingredients: ['1 kg Tomaten', '1 Gurke', '1 Paprika', '1 Knoblauchzehe', '50 ml Olivenöl', '2 EL Sherryessig'],
    instructions: ['Blend everything until smooth.', 'Chill for at least two hours.'],
    prepTime: 15,
    cookTime: 0,
    hue: 355,
  },
  {
    title: 'Paella Valenciana',
    tags: ['Spanish', 'Rice', 'Chicken'],
    description: 'Saffron rice with chicken, green beans and a crisp socarrat.',
    ingredients: ['400 g Paellareis', '500 g Hähnchen', '200 g grüne Bohnen', '1 g Safran', '1,2 l Brühe', '1 Tomate'],
    instructions: ['Brown the chicken.', 'Add beans, tomato and rice.', 'Pour over stock and do not stir.'],
    prepTime: 20,
    cookTime: 40,
  },
  {
    title: 'Ofengemüse',
    tags: ['Vegetarian', 'Oven', 'Side'],
    description: 'Roasted root vegetables with rosemary.',
    ingredients: ['500 g Kartoffeln', '3 Karotten', '1 Süßkartoffel', '2 rote Zwiebeln', '3 EL Olivenöl', 'Rosmarin'],
    instructions: ['Cut everything in even pieces.', 'Roast at 200 °C for 35 minutes.'],
    prepTime: 15,
    cookTime: 35,
    hue: 30,
  },
  {
    title: 'Bibimbap',
    tags: ['Korean', 'Rice'],
    description: 'Rice bowl with vegetables, a fried egg and gochujang.',
    ingredients: ['300 g Reis', '200 g Spinat', '2 Karotten', '150 g Sojasprossen', '2 Eier', '2 EL Gochujang'],
    instructions: ['Cook the rice.', 'Sauté each vegetable separately.', 'Top with a fried egg and gochujang.'],
    prepTime: 25,
    cookTime: 20,
  },
  {
    title: 'Apfelstrudel',
    tags: ['Baking', 'Sweet', 'Austrian'],
    description: 'Paper-thin pastry around apples, raisins and cinnamon.',
    ingredients: ['250 g Mehl', '1 kg Äpfel', '50 g Rosinen', '1 TL Zimt', '80 g Zucker', '60 g Butter', '50 g Semmelbrösel'],
    instructions: ['Rest the dough for an hour.', 'Stretch it over a cloth.', 'Fill, roll and bake at 190 °C.'],
    prepTime: 60,
    cookTime: 40,
    hue: 25,
  },
  {
    title: 'Falafel',
    tags: ['Vegetarian', 'Middle Eastern'],
    description: 'Crisp chickpea fritters with herbs.',
    ingredients: ['250 g getrocknete Kichererbsen', '1 Bund Petersilie', '1 Zwiebel', '2 Knoblauchzehen', '1 TL Kreuzkümmel', 'Öl'],
    instructions: ['Soak the chickpeas overnight.', 'Grind with herbs and spices.', 'Shape and fry.'],
    prepTime: 30,
    cookTime: 15,
  },
  {
    title: 'Coq au Vin',
    tags: ['French', 'Chicken'],
    description: 'Chicken braised in red wine with mushrooms and lardons.',
    ingredients: ['1 Huhn', '750 ml Rotwein', '200 g Champignons', '150 g Speck', '12 Perlzwiebeln', '2 EL Mehl'],
    instructions: ['Brown chicken and lardons.', 'Braise in wine for an hour and a half.', 'Add mushrooms and onions at the end.'],
    prepTime: 30,
    cookTime: 100,
    hue: 330,
  },
  {
    title: 'Overnight Oats',
    tags: ['Breakfast', 'Quick', 'Meal prep'],
    description: 'Oats soaked overnight with yogurt and berries.',
    ingredients: ['80 g Haferflocken', '150 g Joghurt', '100 ml Milch', '1 EL Honig', '100 g Beeren'],
    instructions: ['Mix everything in a jar.', 'Refrigerate overnight.'],
    prepTime: 5,
    cookTime: 0,
  },
  {
    title: 'Goulash',
    tags: ['Hungarian', 'Beef'],
    description: 'Slow-cooked beef with lots of sweet paprika and onions.',
    ingredients: ['1 kg Rindergulasch', '1 kg Zwiebeln', '3 EL Paprikapulver', '2 EL Tomatenmark', '1 l Brühe', 'Kümmel'],
    instructions: ['Caramelize the onions.', 'Add meat and paprika.', 'Braise for two and a half hours.'],
    prepTime: 20,
    cookTime: 150,
    hue: 10,
  },
  {
    title: 'Caprese',
    tags: ['Salad', 'Italian', 'Quick', 'Vegetarian'],
    description: 'Tomatoes, mozzarella and basil, nothing more.',
    ingredients: ['4 Tomaten', '250 g Mozzarella', '1 Bund Basilikum', '3 EL Olivenöl', 'Salz'],
    instructions: ['Slice and layer.', 'Dress with oil and salt.'],
    prepTime: 5,
    cookTime: 0,
  },
  {
    title: 'Sushi Bowl',
    tags: ['Japanese', 'Fish', 'Rice'],
    description: 'Seasoned rice with salmon, avocado and edamame.',
    ingredients: ['300 g Sushireis', '250 g Lachs', '1 Avocado', '100 g Edamame', '3 EL Reisessig', '1 EL Sesam'],
    instructions: ['Cook and season the rice.', 'Slice salmon and avocado.', 'Assemble the bowls.'],
    prepTime: 20,
    cookTime: 20,
    hue: 210,
  },
  {
    title: 'Ratatouille',
    tags: ['French', 'Vegetarian', 'Oven'],
    description: 'Provençal vegetable stew, each vegetable cooked on its own.',
    ingredients: ['1 Aubergine', '2 Zucchini', '2 Paprika', '4 Tomaten', '1 Zwiebel', 'Thymian', '4 EL Olivenöl'],
    instructions: ['Cook each vegetable separately.', 'Combine and simmer for 30 minutes.'],
    prepTime: 25,
    cookTime: 50,
  },
  {
    title: 'Chocolate Mousse',
    tags: ['Dessert', 'French', 'Sweet'],
    description: 'Dark chocolate mousse, airy and not too sweet.',
    ingredients: ['200 g Zartbitterschokolade', '4 Eier', '30 g Zucker', '1 Prise Salz'],
    instructions: ['Melt the chocolate.', 'Fold in yolks, then the beaten whites.', 'Chill for four hours.'],
    prepTime: 20,
    cookTime: 0,
    hue: 300,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Deterministic, so screenshots stay stable: no Math.random.
function historyFor(index: number, now: number): string[] {
  const count = (index * 7) % 5;
  return Array.from({ length: count }, (_, i) => new Date(now - ((index % 9) + i * 11 + 1) * DAY_MS - 18 * 60 * 60 * 1000).toISOString());
}

function thumbnailSvg(title: string, hue: number): Uint8Array {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 70% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 42%)"/>
  </linearGradient></defs>
  <rect width="800" height="450" fill="url(#g)"/>
  <circle cx="400" cy="225" r="130" fill="#fff" fill-opacity="0.18"/>
  <text x="400" y="225" dy="0.35em" text-anchor="middle" font-family="system-ui, sans-serif" font-size="120" font-weight="700" fill="#fff">${initials}</text>
</svg>
`;
  return new TextEncoder().encode(svg);
}

function sampleDto(sample: Sample, index: number, now: number): CreateRecipeDto {
  return {
    title: sample.title,
    flagged: index % 11 === 3,
    description: sample.description,
    source: `https://kitchen.example/recipes/${index + 1}`,
    yield: [2, 4, 4, 6][index % 4] ?? 4,
    nutrition: sample.calories === undefined ? {} : { calories: sample.calories },
    prepTime: sample.prepTime,
    cookTime: sample.cookTime,
    aggregateRating: index % 3 === 0 ? { value: null, count: null } : { value: 3.5 + ((index * 3) % 15) / 10, count: 20 + index * 13 },
    rating: [0, 3.5, 4, 4.5, 5, 0, 3][index % 7] ?? 0,
    ingredients: sample.ingredients,
    instructions: sample.instructions,
    history: historyFor(index, now),
    tags: sample.tags,
  };
}

/** Empties the database and the thumbnail directory, then fills both with the samples through the facades, so they pass validation. */
export async function seed(db: DB, config: Config): Promise<number> {
  clearDatabase(db);
  const dir = config.thumbnailsDir;
  mkdirSync(dir, { recursive: true });
  for (const file of readdirSync(dir)) {
    rmSync(join(dir, file), { force: true, recursive: true });
  }
  const recipes = createRecipesFacade(db, config);
  const now = Date.now();
  for (const [index, sample] of SAMPLES.entries()) {
    const { recipe } = recipes.create(sampleDto(sample, index, now));
    if (sample.hue !== undefined) {
      await recipes.setThumbnail(recipe.id, thumbnailSvg(sample.title, sample.hue), 'image/svg+xml');
    }
  }
  return SAMPLES.length;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const path = config.databasePath;
  mkdirSync(dirname(path), { recursive: true });
  const db = openDatabase(path);
  const count = await seed(db, config);
  db.close();
  console.log(`seeded ${count} recipes into ${path}`);
}

if (import.meta.main) {
  await main();
}

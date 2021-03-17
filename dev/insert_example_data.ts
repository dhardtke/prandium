import { Database } from "../src/data/db.ts";
import { downloadThumbnail } from "../src/data/util/thumbnails.ts";
import { Recipe } from "../src/data/model/recipe.ts";
import { Tag } from "../src/data/model/tag.ts";
import { RecipeService } from "../src/data/service/recipe_service.ts";
import { TagService } from "../src/data/service/tag_service.ts";
import { defaultConfigDir } from "../src/util.ts";

const configDir = defaultConfigDir();
const db = new Database(configDir);
const tagService = new TagService(db);
const recipeService = new RecipeService(db, tagService);

const thumbnail = await downloadThumbnail(
  configDir,
  "https://img.chefkoch-cdn.de/rezepte/2788721431008084/bilder/949592/crop-960x540/blaetterteig-mit-gyrosfuellung-und-feta-kaese.jpg",
);

// TODO find a nice way to integrate this into the dev-server
const tags = Tag.createMany(
  "Fleisch",
  "Hauptspeise",
  "Backen",
  "Party",
  "Schwein",
  "K\u00e4se",
  "Gluten",
  "Lactose",
  "Low Carb",
);
tags.forEach((tag) => tagService.create(tag));
for (let i = 0; i < 50; i++) {
  const history = Array.from(Array(5).keys())
    .map((i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    });

  recipeService.create(
    new Recipe({
      title: `Blätterteig mit Gyrosfüllung und Feta-Käse ${i + 1}`,
      description: "Lorem Ipsum",
      source:
        "https://www.chefkoch.de/rezepte/2788721431008084/Blaetterteig-mit-Gyrosfuellung-und-Feta-Kaese.html",
      thumbnail: thumbnail,
      yield: 4,
      rating: 8.0,
      prepTime: 1800,
      cookTime: 1500,
      ingredients: [
        "400 g Schweineschnitzel",
        "1 EL \u00d6l",
        "1 Zehe\/n Knoblauch",
        "etwas Gyrosgew\u00fcrz",
        "\u00bd TL Thymian , getrockneter",
        "etwas Salz",
        "200 g Feta-K\u00e4se",
        "\u00bd  Gem\u00fcsezwiebel(n)",
        "2 Rolle(n) Bl\u00e4tterteig",
        "etwas Mehl",
        "1  Ei(er)",
        "50 g Feta-K\u00e4se",
        "Sesam",
      ],
      instructions: [
        `Die Schnitzel in feine Streifen schneiden. Das \u00d6l in einer Pfanne erhitzen und das Fleisch darin anbraten.
           Den gew\u00fcrfelten Knoblauch zum Schluss mitbraten. Mit Gyrosgew\u00fcrz, Thymian und Salz w\u00fcrzen.`,
        `Den Feta-K\u00e4se w\u00fcrfeln. Die Zwiebel in feine Streifen schneiden und zusammen mit dem Feta unter das Fleisch mischen.
        Ausk\u00fchlen lassen.`,
        `Den Backofen auf 180 Grad vorheizen. Den Bl\u00e4tterteig ausrollen und in jeweils 6 Quadrate schneiden. Das Ei trennen. Die Teigr\u00e4nder mit
        Eiwei\u00df bestreichen. Das Gyros darauf verteilen. Die Teigquadrate zu Ecken zusammen klappen und etwas andr\u00fccken. Auf 2 mit Backpapier ausgelegte Backbleche
        legen.`,
        `Das Eigelb mit 1 EL Wasser verquirlen. Die Taschen damit bestreichen. Den Feta-K\u00e4se zerbr\u00f6seln und zusammen mit dem Sesam \u00fcber die Taschen streuen. Etwa 20 -
        25 Minuten backen.`,
        `Die Taschen schmecken kalt oder warm. Man kann sie gut in der Mikrowelle aufw\u00e4rmen. Dazu passt ein gemischter oder griechischer Salat.`,
      ],
      tags,
      history,
    }),
  );
}

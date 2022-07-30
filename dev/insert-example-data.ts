import { Database } from "../src/data/db.ts";
import { Recipe, Review } from "../src/data/model/recipe.ts";
import { Tag } from "../src/data/model/tag.ts";
import { RecipeService } from "../src/data/service/recipe.service.ts";
import { TagService } from "../src/data/service/tag.service.ts";
import { buildDbPath } from "../src/data/util/build-db-path.ts";
import { downloadThumbnail } from "../src/data/util/thumbnails.ts";
import { defaultConfigDir } from "../src/shared/util.ts";

const configDir = defaultConfigDir();
const db = new Database(buildDbPath(configDir));
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
tagService.create(tags);
for (let i = 0; i < 50; i++) {
    const history = Array.from(Array(5).keys())
        .map((i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        });

    recipeService.create([
        new Recipe({
            title: `Blätterteig mit Gyrosfüllung und Feta-Käse ${i + 1}`,
            description:
                "Bl\u00e4tterteig mit Gyrosf\u00fcllung und Feta-K\u00e4se - eignen sich auch gut f\u00fcr ein Buffet. \u00dcber 105 Bewertungen und f\u00fcr lecker befunden. Mit \u25ba Portionsrechner \u25ba Kochbuch \u25ba Video-Tipps!",
            source: "https://www.chefkoch.de/rezepte/2788721431008084/Blaetterteig-mit-Gyrosfuellung-und-Feta-Kaese.html",
            thumbnail: thumbnail,
            yield: 4,
            nutritionCalories: "2795 kcal",
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
            reviews: [
                new Review({
                    text: "schnell und lecker! perfekt wenn es mal schnell gehen muss! ",
                    date: "2020-05-12",
                }),
                new Review({
                    text: "haben die Taschen auch schon oft gemacht und wir lieben sie! F\u00fcr meine Vegetarier f\u00fcllen wir mit Blattspinat und Feta. ",
                    date: "2020-02-03",
                }),
                new Review({
                    text:
                        "Wir machen die Taschen auch total gerne. Wir wandeln es nur etwas ab, den Feta ersetze ich mit Hirtenk\u00e4se und die Zwiebeln brate ich direkt mit dem Fleisch an. Beim Taschen formen, nehme ich kein Ei, das h\u00e4lt bei mir auch ohne. Heute gibt es sie wieder, danke f\u00fcr das tolle Rezept. \n\nMeli",
                    date: "2019-10-03",
                }),
                new Review({
                    text: "Meine sind gerade im Backofen. Ich bin sehr gespannt. =)",
                    date: "2019-04-13",
                }),
                new Review({
                    text:
                        "Sehr sehr lecker! habe den Bl\u00e4tterteig vorher noch mit Zaziki bestrichen und, weil \u00fcbrig, nach 10 Minuten im Ofen mit K\u00e4se bestreut und \u00fcberbacken \ud83d\ude0a\ud83d\ude09",
                    date: "2019-04-03",
                }),
            ],
        }),
    ]);
}

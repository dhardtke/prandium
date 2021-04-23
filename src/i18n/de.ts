import { Language } from "./mod.ts";

export const de: Language = {
  appName: "CookGuide",
  cancel: "Abbrechen",
  confirmation: "Bestätigung",
  create: "Erstellen",
  createdAt: "Erstellt",
  delete: "Löschen",
  description: "Beschreibung",
  down: "Unten",
  edit: "Bearbeiten",
  error: {
    404: {
      description: "Die gesuchte Seite kann nicht gefunden werden.",
      title: "Nicht gefunden",
    },
    500: {
      description: "Es ist ein Serverfehler aufgetreten.",
      title: "Serverfehler",
    },
    title: "Fehler",
  },
  home: "Startseite",
  id: "ID",
  info: "Info",
  navigation: {
    filterPlaceholder: "Beginne zu Tippen um zu filtern...",
    filterTitle: "Filter",
    tags: "Tags",
  },
  no: "Nein",
  orderBy: {
    asc: "Wechsel zu aufsteigender Reihenfolge",
    desc: "Wechsel zu absteigender Reihenfolge",
    title: "Sortiere nach",
  },
  pagination: {
    next: "Nächste Seite",
    previous: "Vorherige Seite",
  },
  recipe: {
    aggregateRating: "Fremde Bewertung",
    aggregateRatingCount: "Anzahl fremder Bewertungen",
    aggregateRatingValue: "Fremde Bewertung",
    clearAllTags: "Lösche alle",
    cookTime: "Kochzeit",
    cookedCount: "Kochanzahl",
    createSuccessful: "Das Rezept wurde erfolgreich angelegt.",
    deleteConfirmation: "Soll dieses Rezept wirklich gelöscht werden?",
    deleteSuccessful: "Das Rezept wurde erfolgreich gelöscht.",
    editSuccessful: "Das Rezept wurde erfolgreich bearbeitet.",
    form: {
      createIngredient: "Neue Zutat",
      createInstruction: "Neue Anweisung",
      deleteThumbnail: "Lösche Vorschaubild",
      group: {
        basic: "Allgemein",
        nutrition: "Nährwerte",
        ratings: "Bewertungen",
        times: "Zeiten",
      },
      imageError: "Es muss ein gültiges Bild ausgewählt werden.",
      thumbnailHint: "Hier kann geklickt oder ein Bild hineingezogen werden.",
      timeHint: "Zeit in Sekunden.",
    },
    import: {
      alert:
        "Die URLs wurden verarbeitet und die Ergebnisse sind folgend zu entnehmen.",
      result: "Ergebnis",
      sourceUrl: "Quell-URL",
      title: "Import",
      urlInfo: "Eine URL pro Zeile.",
      urls: "URLs",
    },
    ingredients: {
      step: (step) => `Schritt ${step}`,
      title: "Zutaten",
    },
    instructions: "Anweisungen",
    lastCooked: (distance) => `Zuletzt gekocht ${distance}.`,
    lastCookedAt: "Zuletzt gekocht am",
    noRecipesFound:
      "Für den aktuell gewählten Filter wurden keine Rezepte gefunden. Bitte die Auswahl ändern oder neue Rezepte hinzufügen.",
    notCookedYet: "Noch nicht gekocht.",
    nutrition: {
      calories: "Kalorien",
      carbohydrate: "Kohlenhydrat",
      cholesterol: "Cholesterin",
      fat: "Fett",
      fiber: "Ballaststoffe",
      protein: "Proteine",
      saturatedFat: "Gesättigte Fettsäuren",
      sodium: "Natrium",
      sugar: "Zucker",
      transFat: "Transfettsäuren",
      unsaturatedFat: "Ungesättigte Fettsäuren",
    },
    open: "Öffnen",
    orderBy: "Sortiere nach",
    portions: "Portionen",
    prepTime: "Vorbereitungszeit",
    rating: "Bewertung",
    reviews: "Rezensionen",
    source: "Quelle",
    time: {
      cook: "Kochzeit",
      prep: "Vorbereitungszeit",
      total: "Gesamtzeit",
    },
    yield: "Gesamtportionen",
  },
  recipes: "Rezepte",
  save: "Speichern",
  search: "Suchen",
  title: "Titel",
  up: "Hoch",
  updatedAt: "Aktualisiert",
  yes: "Ja",
  meta: {
    id: "de",
    flag:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3"><path d="M0 0h5v3H0z"/><path fill="#D00" d="M0 1h5v2H0z"/><path fill="#FFCE00" d="M0 2h5v1H0z"/></svg>`,
    labels: {
      de: "Deutsch",
      en: "Englisch",
    },
  },
} as const;

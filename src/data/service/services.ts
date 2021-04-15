import { Database } from "../db.ts";
import { RecipeService } from "./recipe.service.ts";
import { TagService } from "./tag.service.ts";

type Class<S> = new (...args: any[]) => S;

export interface Services {
  get: <S>(serviceClass: Class<S>) => S;
}

type AllServices = TagService | RecipeService;

export let services = new class implements Services {
  private initialized = false;
  private lut: Partial<Record<string, AllServices>> = {};

  initialize(db: Database) {
    if (this.initialized) {
      throw new Error();
    }
    this.initialized = true;
    const tagService = new TagService(db);
    this.lut = {
      [TagService.name]: tagService,
      [RecipeService.name]: new RecipeService(db, tagService),
    };
  }

  get<S>(serviceClass: Class<S>): S {
    if (!this.lut[serviceClass.name]) {
      throw Error(`Fatal: ${String(serviceClass.name)} is not a registered service.`);
    }
    return this.lut[serviceClass.name]! as unknown as S;
  }
};

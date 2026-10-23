// The optional marker lets a plain number or string assign in without a cast, but not another flavor.
interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

export type RecipeId = Flavor<number, 'RecipeId'>;

export type TagId = Flavor<number, 'TagId'>;

export type Iso8601DateTime = Flavor<string, 'Iso8601DateTime'>; // YYYY-MM-DDTHH:MM:SS.sssZ

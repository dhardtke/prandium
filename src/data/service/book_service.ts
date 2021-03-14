import { Database } from "../db.ts";
import { Recipe } from "../model/recipe.ts";
import { toArray, toCamelCase } from "../convert.ts";
import { Service } from "./service.ts";
import { Book } from "../model/book.ts";
import { OrderBy } from "../helper/order_by.ts";

export class BookService implements Service<Book> {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // TODO filter arguments
  count(): number {
    return this.db.single<{ total: number }>(
      "SELECT COUNT(*) AS total FROM book",
    )!.total;
  }

  list(
    limit?: number,
    offset?: number,
    orderBy: OrderBy = OrderBy.EMPTY,
    loadRecipes?: boolean,
  ): Book[] {
    // TODO support loadRecipes
    return toArray(
      this.db.query(
        `SELECT id, created_at, updated_at, name, description FROM book ${
          orderBy?.sql(Recipe.columns)
        } LIMIT ? OFFSET ?`,
        [
          limit,
          offset,
        ],
      ),
      (src) => new Book(toCamelCase(src)),
    );
  }

  save(book: Book) {
    this.db.exec(
      "INSERT INTO book (created_at, updated_at, name, description) VALUES (?, ?, ?, ?)",
      [
        book.createdAt,
        book.updatedAt,
        book.name,
        book.description,
      ],
    );
    book.id = this.db.lastInsertRowId;
  }

  update(book: Book) {
    this.db.exec(
      "UPDATE book SET updated_at = ?, name = ?, description = ? WHERE id = ?",
      [book.updatedAt, book.name, book.description, book.id],
    );
  }

  find(id: number): Book | undefined {
    const result = this.db.single(
      "SELECT id, created_at, updated_at, name, description FROM book WHERE id = ?",
      [id],
    );
    return result ? new Book(toCamelCase(result)) : undefined;
  }
}

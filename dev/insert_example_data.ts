import { Database } from "../src/data/db.ts";
import { defaultConfigDir } from "../src/util.ts";

const db = new Database(defaultConfigDir());

// TODO find a nice way to integrate this into the dev-server
for (let i = 0; i < 5; i++) {
  await db.exec(
    `INSERT INTO book (name, description)
     VALUES (?, 'Lorem Ipsum')`,
    [`Book ${i + 1}`],
  );
  const bookId = db.lastInsertRowId;
  for (let i = 0; i < 50; i++) {
    await db.exec(
      `INSERT INTO recipe (name, description, book_id)
       VALUES (?, 'Lorem Ipsum', ?)`,
      [`Recipe ${i + 1}`, bookId],
    );
  }
}

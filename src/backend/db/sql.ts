export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

export function isForeignKeyViolation(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY';
}

export interface UpdateStatement {
  sql: string;
  values: (string | number | null)[];
}

// Columns come only from the hard-coded `fields`, never the patch's keys, so a body cannot inject SQL.
export function buildUpdate<T extends object>(table: string, fields: readonly Extract<keyof T, string>[], patch: Partial<T>): UpdateStatement | null {
  const assignments: string[] = [];
  const values: (string | number | null)[] = [];

  for (const field of fields) {
    const value = patch[field];
    // An undefined field is left alone, while null clears the column.
    if (value !== undefined) {
      if (value !== null && typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(`Cannot bind ${table}.${field}: expected a string, a number or null`);
      }
      assignments.push(`${field} = ?`);
      values.push(value);
    }
  }

  if (assignments.length === 0) {
    return null;
  }
  return { sql: `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = ?`, values };
}

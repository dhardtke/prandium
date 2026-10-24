// Erases types without checking them or rewriting import specifiers.
import { log } from '../../../shared/log.ts';

const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser' });

export async function transpileModule(path: string): Promise<string | null> {
  const source = await Bun.file(path).text();

  try {
    return transpiler.transformSync(source);
  } catch (cause) {
    // null rather than broken code, so ce-app's failed-import path shows a toast.
    log.error('static', `could not transpile ${path}`, cause);
    return null;
  }
}

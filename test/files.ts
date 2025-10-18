import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function* walkSync(dir: string): IterableIterator<string> {
  const isFile = statSync(dir).isFile();

  if (isFile) {
    yield dir;

    return;
  }

  const files = readdirSync(dir, "utf-8");

  for (const file of files) {
    const pathToFile = join(dir, file);
    let isDirectory = false;

    try {
      isDirectory = statSync(pathToFile).isDirectory();
    } catch (_) {
      // No biggie, something maybe denied permission or something
    }

    if (isDirectory) {
      yield* walkSync(pathToFile);
    } else {
      yield pathToFile;
    }
  }
}

const includeDefaults: RegExp[] = [];
const excludeDefaults: RegExp[] = [/node_modules(\/|\\)/, /dist(\/|\\)/];

function isInRuleset(path: string, rules: RegExp[]): boolean {
  for (const rule of rules) {
    if (rule.test(path)) {
      return true;
    }
  }

  return false;
}

export function directory(
  absolutePaths: string[],
  traverse: (name: string, read: () => string) => void,
  { include = includeDefaults, exclude = excludeDefaults }: {
    include?: RegExp[];
    exclude?: RegExp[];
  } = {},
) {
  for (const p of absolutePaths) {
    for (const file of walkSync(p)) {
      const excluded = isInRuleset(file, exclude);
      const included = isInRuleset(file, include);

      if (!excluded && included) {
        traverse(file, () => readFileSync(file).toString());
      }
    }
  }
}

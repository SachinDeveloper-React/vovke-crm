// ----------------------------------------------------------------------

export function flattenArray<T extends Record<string, unknown>>(
  list: T[] | undefined,
  key: keyof T = 'children' as keyof T
): T[] {
  if (!list?.length) return [];

  const children: T[] = [];

  const flatten = list.map((item) => {
    const childItems = item[key];

    if (Array.isArray(childItems) && childItems.length) {
      children.push(...(childItems as T[]));
    }

    return item;
  });

  return flatten.concat(
    children.length ? flattenArray(children, key) : []
  );
}

// ----------------------------------------------------------------------

export function flattenDeep<T>(array: T[] | undefined): T[] {
  if (!Array.isArray(array)) {
    return [];
  }

  return array.flat(Infinity) as T[];
}

// ----------------------------------------------------------------------

export function orderBy<T extends Record<string, unknown>>(
  array: T[],
  properties: (keyof T)[],
  orders?: ('asc' | 'desc')[]
): T[] {
  return array.slice().sort((a, b) => {
    for (let i = 0; i < properties.length; i += 1) {
      const property = properties[i];
      const order = orders?.[i] === 'desc' ? -1 : 1;

      const aValue = a[property];
      const bValue = b[property];

      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
    }

    return 0;
  });
}

// ----------------------------------------------------------------------

export function keyBy<T extends Record<string, unknown>>(
  array: T[] | undefined,
  key?: keyof T
): Record<string, T> {
  return (array ?? []).reduce<Record<string, T>>((result, item) => {
    const keyValue = key ? item[key] : item;

    result[String(keyValue)] = item;

    return result;
  }, {});
}

// ----------------------------------------------------------------------

export function sumBy<T>(
  array: T[],
  iteratee: (item: T) => number
): number {
  return array.reduce((sum, item) => sum + iteratee(item), 0);
}

// ----------------------------------------------------------------------

export function isEqual<T>(a: T, b: T): boolean {
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (
    typeof a === 'string' ||
    typeof a === 'number' ||
    typeof a === 'boolean'
  ) {
    return a === b;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    a !== null &&
    b !== null
  ) {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every((key) =>
      isEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

type AnyObject = Record<string, unknown>;

function isObject(value: unknown): value is AnyObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function merge<T extends AnyObject>(
  target: T,
  ...sources: AnyObject[]
): T {
  const output = target as AnyObject;

  for (const source of sources) {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];

      if (isObject(sourceValue)) {
        const targetValue = output[key];

        if (isObject(targetValue)) {
          merge(targetValue, sourceValue);
        } else {
          output[key] = merge({}, sourceValue);
        }
      } else {
        output[key] = sourceValue;
      }
    }
  }

  return output as T;
}
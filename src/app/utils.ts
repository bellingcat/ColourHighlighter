/**
 * Ensures an array has a fixed length by filling in missing entries.
 *
 * @param arr - Source array, whose values you want to keep if present.
 * @param def - Default value to insert when arr[i] is undefined.
 * @param len - Desired length of the output array (defaults to 4).
 * @returns New array of length `len`, using arr[i] or `def`.
 */
export function fillArray<T>(arr: Array<T | undefined>, def: T, len = 4): T[] {
  const out: T[] = [];
  for (let i = 0; i < len; ++i) {
    out.push(arr[i] !== undefined ? (arr[i] as T) : def);
  }
  return out;
}

/**
 * Creates a debounced version of a function, delaying its execution
 * until after `ms` milliseconds have passed without new calls.
 *
 * @param fn - The function to debounce.
 * @param ms - Delay in milliseconds before `fn` is invoked.
 * @returns Wrapped function that delays calls to `fn`.
 */
export function debounce<Args extends any[]>(fn: (...args: Args) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

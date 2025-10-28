export function debounce<F extends (...args: unknown[]) => void>(
  func: F,
  delay: number
) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

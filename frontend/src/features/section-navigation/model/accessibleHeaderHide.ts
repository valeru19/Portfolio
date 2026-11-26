export type AccessibleHeaderHideInput = {
  scrollY: number;
  deltaY: number;
  isFocusInsideHeader: boolean;
  currentlyHidden: boolean;
};

/**
 * Scroll-spy хедера в accessible (из legacy) + focus-guard, чтобы клавиатура
 * не теряла фокус, когда шапка иначе бы спряталась.
 */
export function nextAccessibleHeaderHidden({
  scrollY,
  deltaY,
  isFocusInsideHeader,
  currentlyHidden,
}: AccessibleHeaderHideInput): boolean {
  if (isFocusInsideHeader) return false;

  if (scrollY <= 12) return false;
  if (deltaY > 4 && scrollY > 48) return true;
  if (deltaY < -1) return false;
  return currentlyHidden;
}

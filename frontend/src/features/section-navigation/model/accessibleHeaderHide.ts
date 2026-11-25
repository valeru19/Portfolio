export type AccessibleHeaderHideInput = {
  scrollY: number;
  deltaY: number;
  isFocusInsideHeader: boolean;
  currentlyHidden: boolean;
};

/**
 * Legacy scroll spy for accessible header, plus a focus guard so keyboard
 * users do not lose the focused control when the bar would otherwise hide.
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

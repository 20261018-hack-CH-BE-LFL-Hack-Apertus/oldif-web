export async function printReport(root: HTMLElement | null) {
  await document.fonts.ready;
  const images = Array.from(root?.querySelectorAll("img") ?? []);
  await Promise.allSettled(images.map((image) => image.decode()));
  window.print();
}
export function nextSlide(key: string, index: number, count: number) {
  if (key === "ArrowRight") return Math.min(index + 1, count - 1);
  if (key === "ArrowLeft") return Math.max(index - 1, 0);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return index;
}
export function isEditing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input,textarea,select,[contenteditable=true]"))
  );
}

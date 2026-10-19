import { between, exact, nullable, object, text } from "./strict";
export type Point = { x: number; y: number };
export type CanvasLayout = {
  session_id: string;
  positions: Record<string, Point>;
  selected_source_id: string | null;
};
export const canvasDefault: CanvasLayout = {
  session_id: "",
  positions: {},
  selected_source_id: null,
};
const identifier = (value: unknown): value is string =>
  text(value) && value.length <= 200;
export function validCanvas(value: unknown): value is CanvasLayout {
  return exact(value, {
    session_id: identifier,
    selected_source_id: nullable(identifier),
    positions: (positions): positions is unknown =>
      object(positions) &&
      Object.keys(positions).length <= 100 &&
      Object.entries(positions).every(
        ([id, point]) =>
          identifier(id) &&
          id.length > 0 &&
          exact(point, {
            x: between(-10000, 10000),
            y: between(-10000, 10000),
          }),
      ),
  });
}
export const boundPoint = (point: Point): Point => ({
  x: Math.max(-10000, Math.min(10000, Math.round(point.x))),
  y: Math.max(-10000, Math.min(10000, Math.round(point.y))),
});
export function withPosition(
  layout: CanvasLayout,
  id: string,
  point: Point,
): CanvasLayout {
  const entries = Object.entries(layout.positions)
    .filter(([key]) => key !== id)
    .slice(-99);
  return {
    ...layout,
    positions: { ...Object.fromEntries(entries), [id]: boundPoint(point) },
  };
}

import { expect, test } from "bun:test";
import {
  boundPoint,
  canvasDefault,
  validCanvas,
  withPosition,
} from "./canvasLayout";

test("canvas layouts reject unknown fields and unsafe coordinates", () => {
  expect(validCanvas(canvasDefault)).toBe(true);
  expect(
    validCanvas({ ...canvasDefault, positions: { a: { x: 10, y: -20 } } }),
  ).toBe(true);
  expect(validCanvas({ ...canvasDefault, secret: true })).toBe(false);
  expect(
    validCanvas({ ...canvasDefault, positions: { a: { x: Infinity, y: 0 } } }),
  ).toBe(false);
  expect(
    validCanvas({ ...canvasDefault, positions: { a: { x: 0, y: 10001 } } }),
  ).toBe(false);
  expect(
    validCanvas({ ...canvasDefault, positions: { a: { x: 0, y: 0, z: 0 } } }),
  ).toBe(false);
  expect(validCanvas({ ...canvasDefault, selected_source_id: {} })).toBe(false);
});
test("node movement remains bounded and retains at most one hundred positions", () => {
  let layout = canvasDefault;
  for (let i = 0; i < 102; i++)
    layout = withPosition(layout, `node-${i}`, { x: i, y: -i });
  expect(Object.keys(layout.positions)).toHaveLength(100);
  expect(validCanvas(layout)).toBe(true);
  expect(boundPoint({ x: 50000, y: -50000 })).toEqual({ x: 10000, y: -10000 });
});

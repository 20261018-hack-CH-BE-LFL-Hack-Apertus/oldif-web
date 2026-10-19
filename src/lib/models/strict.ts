export type Validator<T = unknown> = (value: unknown) => value is T;
export const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export const text = (value: unknown): value is string =>
  typeof value === "string";
export const bool = (value: unknown): value is boolean =>
  typeof value === "boolean";
export const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
export const integer = (value: unknown): value is number =>
  finite(value) && Number.isSafeInteger(value) && value >= 0;
export const optional =
  (validator: Validator): Validator =>
  (value): value is unknown =>
    value === undefined || validator(value);
export const nullable =
  (validator: Validator): Validator =>
  (value): value is unknown =>
    value === null || validator(value);
export const list =
  (validator: Validator): Validator =>
  (value): value is unknown =>
    Array.isArray(value) && value.every(validator);
export const oneOf =
  (...values: unknown[]): Validator =>
  (value): value is unknown =>
    values.includes(value);
export const between =
  (min: number, max: number): Validator =>
  (value): value is unknown =>
    finite(value) && value >= min && value <= max;
export function exact(
  value: unknown,
  fields: Record<string, Validator>,
): value is Record<string, unknown> {
  return (
    object(value) &&
    Object.keys(value).every((key) => Object.hasOwn(fields, key)) &&
    Object.entries(fields).every(([key, validate]) => validate(value[key]))
  );
}
export function requireValid<T>(
  value: unknown,
  validate: Validator<T>,
  name: string,
): T {
  if (!validate(value))
    throw new Error(`Invalid ${name} response; data was not applied`);
  return value;
}

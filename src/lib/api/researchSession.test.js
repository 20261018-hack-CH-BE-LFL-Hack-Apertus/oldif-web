import { expect, test } from "bun:test";
import { selectResearchSession } from "./researchSession";

test("late session creation cannot select or connect after the user leaves", async () => {
  let resolve;
  let current = true;
  const selected = [],
    connected = [];
  const pending = selectResearchSession({
    id: "",
    current: () => current,
    create: () =>
      new Promise((r) => {
        resolve = r;
      }),
    select: (id) => selected.push(id),
    connect: async (id) => {
      connected.push(id);
    },
  });
  current = false;
  resolve("obsolete");
  expect(await pending).toBeUndefined();
  expect(selected).toEqual([]);
  expect(connected).toEqual([]);
});
test("current session selection connects exactly the authorized identifier", async () => {
  const selected = [],
    connected = [];
  expect(
    await selectResearchSession({
      id: "existing",
      current: () => true,
      create: async () => {
        throw Error("must not create");
      },
      select: (id) => selected.push(id),
      connect: async (id) => {
        connected.push(id);
      },
    }),
  ).toBe("existing");
  expect(selected).toEqual(["existing"]);
  expect(connected).toEqual(["existing"]);
});

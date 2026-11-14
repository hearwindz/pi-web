import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const {
  COST_DISPLAY_DEFAULT,
  clampCostRate,
  formatMoney,
  fromCny,
  fromUsd,
  parseCostDisplay,
  setCostDisplay,
} = await jiti.import("./cost-display.ts");

test("reads the stored preference, defaulting to CNY at 7", () => {
  assert.deepEqual(parseCostDisplay(null), COST_DISPLAY_DEFAULT);
  assert.deepEqual(parseCostDisplay("not json"), COST_DISPLAY_DEFAULT);
  assert.deepEqual(parseCostDisplay(JSON.stringify({ currency: "usd", rate: 6.8 })), { currency: "usd", rate: 6.8 });
  // Unknown currency falls back to CNY, and a missing/absurd rate to the clamped bounds.
  assert.deepEqual(parseCostDisplay(JSON.stringify({ currency: "eur", rate: 99 })), { currency: "cny", rate: 20 });
  assert.deepEqual(parseCostDisplay(JSON.stringify({ currency: "usd" })), { currency: "usd", rate: 7 });
  assert.equal(clampCostRate("abc"), 7);
  assert.equal(clampCostRate(0), 1);
});

test("shows pi's USD cost in the currency the setting asks for", () => {
  setCostDisplay({ currency: "cny", rate: 7 });
  assert.equal(formatMoney(fromUsd(0.1375)), "¥0.96");
  assert.equal(formatMoney(fromCny(0.005)), "¥0.0050");

  setCostDisplay({ currency: "usd", rate: 7 });
  assert.equal(formatMoney(fromUsd(0.1375)), "$0.14");
  assert.equal(formatMoney(fromCny(0.007)), "$0.0010");

  setCostDisplay(COST_DISPLAY_DEFAULT);
});

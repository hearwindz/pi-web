"use client";

import { useSyncExternalStore } from "react";

/**
 * 费用展示货币。pi 记录的 cost 一律是美元，人民币账户（DeepSeek 等）折成 ¥ 显示。
 * 关掉就显示 pi 原样的 $。
 */
export interface CostDisplay {
  currency: "cny" | "usd";
  /** 1 美元折多少人民币，只在 currency === "cny" 时生效。 */
  rate: number;
}

export const COST_DISPLAY_STORAGE_KEY = "pi-web:cost-display";
export const COST_DISPLAY_DEFAULT: CostDisplay = { currency: "cny", rate: 7 };
export const COST_RATE_MIN = 1;
export const COST_RATE_MAX = 20;

export function clampCostRate(value: unknown): number {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return COST_DISPLAY_DEFAULT.rate;
  return Math.min(COST_RATE_MAX, Math.max(COST_RATE_MIN, Math.round(rate * 100) / 100));
}

export function parseCostDisplay(raw: string | null): CostDisplay {
  if (!raw) return COST_DISPLAY_DEFAULT;
  try {
    const parsed = JSON.parse(raw) as { currency?: unknown; rate?: unknown } | null;
    return {
      currency: parsed?.currency === "usd" ? "usd" : "cny",
      rate: clampCostRate(parsed?.rate),
    };
  } catch {
    return COST_DISPLAY_DEFAULT;
  }
}

function readStored(): CostDisplay {
  try {
    return parseCostDisplay(window.localStorage.getItem(COST_DISPLAY_STORAGE_KEY));
  } catch {
    return COST_DISPLAY_DEFAULT;
  }
}

let display: CostDisplay | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): CostDisplay {
  if (display === null) display = typeof window === "undefined" ? COST_DISPLAY_DEFAULT : readStored();
  return display;
}

export function getCostDisplay(): CostDisplay {
  return getSnapshot();
}

export function setCostDisplay(next: CostDisplay): void {
  display = { currency: next.currency === "usd" ? "usd" : "cny", rate: clampCostRate(next.rate) };
  try {
    window.localStorage.setItem(COST_DISPLAY_STORAGE_KEY, JSON.stringify(display));
  } catch {
    // Applies in memory even if the browser cannot save it.
  }
  listeners.forEach((listener) => listener());
}

export function useCostDisplay(): CostDisplay {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getSnapshot,
    () => COST_DISPLAY_DEFAULT,
  );
}

export function currencySymbol(): string {
  return getSnapshot().currency === "cny" ? "¥" : "$";
}

/** pi 的美元费用换成展示货币。 */
export function fromUsd(usd: number): number {
  const current = getSnapshot();
  return current.currency === "cny" ? usd * current.rate : usd;
}

/** 人民币计价的项（搜索/抓取单价）换成展示货币。 */
export function fromCny(cny: number): number {
  const current = getSnapshot();
  return current.currency === "cny" ? cny : cny / current.rate;
}

/** ¥0.0050 · ¥0.96 · $0.14 */
export function formatMoney(amount: number): string {
  return `${currencySymbol()}${amount < 0.01 ? amount.toFixed(4) : amount.toFixed(2)}`;
}

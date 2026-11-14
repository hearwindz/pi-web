// Client-safe display of session usage: the toolbar's stats button and
// popover, and the agent switcher's per-agent rows.

import { currencySymbol, formatMoney, fromUsd } from "./cost-display";
import type { TranslationParams } from "./i18n/types";

/** 950 · 18k · 1.2M */
export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

// pi 的 cost 一律是美元；DeepSeek 这类账户按人民币结算，折不折、按什么汇率折
// 由 Settings › General 的「费用以人民币显示」决定（lib/cost-display.ts）。
/** ¥0.84 · <¥0.01 · null when nothing was billed. Takes pi's USD cost. */
export function formatCostShort(costUsd: number): string | null {
  if (!(costUsd > 0)) return null;
  const amount = fromUsd(costUsd);
  return amount >= 0.01 ? formatMoney(amount) : `<${currencySymbol()}0.01`;
}

/** "4 messages · 18k tokens · ¥0.84": the one line `/session` answers with in a tab, which has no popover. */
export function formatSessionSummary(stats: { totalMessages: number; tokens: { total: number }; cost: number } | null, t: (key: string, params?: TranslationParams) => string): string {
  if (!stats) return t("session.noUsage");
  const cost = formatCostShort(stats.cost);
  const summary = t(stats.totalMessages === 1 ? "session.usageSummaryOne" : "session.usageSummary", { messages: stats.totalMessages, tokens: formatCompactCount(stats.tokens.total) });
  return [summary, ...(cost ? [cost] : [])].join(" · ");
}

/** 0s · 42s · 3m 5s · 1h 20m */
export function formatActiveDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

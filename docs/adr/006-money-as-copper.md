# ADR-006: Money is stored as integer copper 🪙

- **Status:** ✅ Accepted
- **Date:** 2024-02-05
- **Deciders:** Morgan Blackthorn, Priya Valdez

## Context

The original billing code (2022) stores gold as `DECIMAL`, reads it into JavaScript numbers and does arithmetic on floats. The result: invoices that are off by a copper here and there, totals that differ between screens depending on which formatter rounds which way, and one very long raven from a dragon about 0.01 gp.

## Decision

- **All money is an integer number of copper pieces (cp).** 1 gold piece = 100 copper.
- New tables use `*_copper INT` columns. No `DECIMAL`, no `FLOAT`.
- Conversion to gold happens **only** for display, with `formatCopper()` from `@bandage/shared`.
- Rounding happens once, at the line level, when a quantity is multiplied by a price.
- **Billing v2** is built on this, behind the `ENABLE_BILLING_V2` feature flag, and replaces the legacy billing module once it's switched on everywhere.

## Rollout plan 🚀

1. ✅ Part 1: copper helpers, v2 tables, this ADR.
2. ⏳ Part 2: v2 invoice engine, payments, backfill of old invoices.
3. ⏳ Part 3: switch every screen to v2, turn the flag on, delete `legacy/billing`.

## Consequences

- 👍 Exact money. No more "where did that copper go?"
- 👎 Until part 3 is done there are two billing systems. Keep them in sync.

# 💰 Billing v2

The new billing engine. Exact, copper-based and ready to replace `legacy/billing`! 🎉

## Why

The 2022 billing code stores gold as floats. That means:
- totals that drift by 0.01 gp
- a late fee charged on the pickup day itself (oops)
- treatment supplies never billed at all

Billing v2 fixes all of this. See [ADR-006](../../../../../docs/adr/006-money-as-copper.md).

## How it works

```
Stay ──▶ engine.buildLines() ──▶ InvoiceLineV2[] ──▶ InvoiceV2 (totalCopper)
                                                        │
                                                        └──▶ PaymentV2[]
```

- `engine.ts` — pure functions, 100% unit tested. Stay in, lines out.
- `billing-v2.service.ts` — persistence, invoice numbers, payments, legacy bridge.
- `creditNotes.ts` — refunds (part 3).
- `../../legacy/billing/v2bridge.ts` — serves v2 data in the old shape so old screens light up when the flag is on.

## Rollout status 🚀

| Part | What | Status |
| --- | --- | --- |
| 1 | Copper helpers, tables, ADR | ✅ Done |
| 2 | Engine, backfill, payments, v2 list | ✅ Done |
| 3 | Credit notes, owner screens, flip `ENABLE_BILLING_V2`, delete `legacy/billing` | 🏗️ Almost there! |

## Turning it on

- Locally: `ENABLE_BILLING_V2=true` in `.env`.
- For everyone: Admin → flags → `ENABLE_BILLING_V2`.

That's it. It just works. ✨

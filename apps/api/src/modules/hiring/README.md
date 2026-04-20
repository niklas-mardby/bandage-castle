# 🏛️ Hiring Hall

Overlords hire monsters that are looking for a new lair.

## Flow

```
Listing (DRAFT) ──open──▶ Listing (OPEN) ──overlord applies──▶ Application (PENDING)
                                                                │
                              staff accept ◀────────────────────┤
                                   │                            └──▶ staff reject / overlord withdraws
                                   ▼
                       Contract drafted (HH-XXXX) ──overlord signs──▶ monster HIRED, listing CLOSED
```

- Accepting one application rejects all other pending ones for the same listing.
- Listings appear in the public Hall from their `availableFrom` date, and only if the monster has no ongoing treatment.
- "Available soon" shows listings starting in the next 30 days.

## Files

- `hiring.service.ts` — listings and the public Hall
- `applications.service.ts` — apply, withdraw, accept/reject (drafts the contract)
- `contracts.service.ts` — list and sign
- `reference.ts` — contract references like `HH-7KQ2`

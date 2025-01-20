# ADR-008: Redis cache for slow reads 🔴

- **Status:** ⚰️ Superseded (removed January 2024)
- **Date:** 2023-11-07 (written down retroactively in 2025-01)
- **Deciders:** Tobias Fenwick

## Context

The species list was slow (see `#47`). Rather than optimise the queries, we put a cache in front of it.

## Decision

`apps/api/src/cache.ts`: Redis when `REDIS_URL` is set, an in-memory map otherwise. Writes invalidated by key prefix.

## What happened

- Nobody ran Redis locally, and production never got a `REDIS_URL`, so in practice it was always the in-memory map.
- The in-memory map served stale compatibility rules for up to a minute after a change (`#56`).
- Removed in January 2024. The real fix was making the query fast (May 2024).

Written down so nobody adds it back without reading this first. 🙏

# ADR-007: NotificationService replaces Raven Post 🐦➡️🔔

- **Status:** ✅ Accepted
- **Date:** 2024-04-02
- **Deciders:** Morgan Blackthorn

## Context

Raven Post (`legacy/ravenPost`) can only write to `tbl_raven` for customers. Staff have no way to be told anything ("a new application arrived", "the basilisk escaped"). The ravens themselves are just a log line every 15 seconds.

## Decision

- New `NotificationService` (`modules/notifications`) is **the only way** to notify anyone.
- Staff get in-app notifications (🔔 in the top bar).
- Customers get a notification on their preferred channel (raven, crystal ball, email). For ravens it still calls Raven Post under the hood until the raven loop is replaced.
- `sendRaven()` is marked `@deprecated`. Replace call sites with `NotificationService.notifyCustomer()` as you touch them.

## Consequences

- 👍 One place to add new channels.
- 👎 Until all call sites are migrated, some messages go through both systems and some only through Raven Post.

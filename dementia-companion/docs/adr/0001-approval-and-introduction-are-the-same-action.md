# ADR-0001: Approval and Introduction Are the Same Action

**Status:** Accepted

## Context

After a Companion's Avatar Assets are ready, the Caregiver must preview them before the Tablet unlocks. Two models were considered:

- **Approve then introduce separately**: Caregiver approves the avatar (persisting an `avatarApproved` state), then at a later time triggers Introduction to the Tablet — allowing approval today, introduction when the patient is having a good moment.
- **Approve = introduce**: A single action previews the assets and immediately fires Introduction to the Tablet.

## Decision

Approval and Introduction are the same action. There is no intermediate `avatarApproved` state. When the Caregiver clicks "Introduce [Name]" after watching the preview, `avatarUnlocked` is set to `true` and the Tablet is notified immediately.

## Rationale

The Caregiver controls *when* to introduce by choosing when to open the preview modal. A separate approval state adds DB complexity and a second UI action without adding meaningful control — the Caregiver can simply wait to open the modal until they're ready.

## Consequences

- No `avatarApproved` field on the Companion model.
- `avatarUnlocked` is the single gate: false = not introduced, true = introduced.
- Introduction cannot be undone.

# Security Specification & Test Matrix for Rift Manga Platform

## 1. Data Invariants
- User profile data in `/users/{userId}` belongs strictly to the authenticated user matching `{userId}`.
- Subcollections `/users/{userId}/library/{comicSlug}` and `/users/{userId}/progress/{comicSlug}` inherit the parent gate: only the owner can read or write.
- Forum comments in `/comments/{commentId}` can be read publicly by readers, but can only be authored by authenticated users whose `authorId` strictly matches `request.auth.uid`. Upvoting can only mutate the `upvotes` field.
- Feedback tickets in `/feedback/{feedbackId}` can be created by any user to contact support, but cannot be read or enumerated by ordinary clients to prevent PII exposure.
- All IDs are constrained to alphanumeric characters, dashes, and underscores up to 128 characters.
- String fields enforce maximum length bounds to prevent denial-of-wallet resource inflation attacks.

## 2. The Dirty Dozen Payloads (Targeting Rejection)
1. **Ghost Field in User Profile**: Payload with unauthorized `role: 'superadmin'` or arbitrary ghost properties. Expected: REJECTED by `hasOnly()`.
2. **Identity Spoofing in Comments**: Setting `authorId: 'victim-uid'` when authenticated as `attacker-uid`. Expected: REJECTED by identity check.
3. **Cross-User Library Reading**: User B attempting `get` or `list` on `/users/userA/library`. Expected: REJECTED by owner gate.
4. **Cross-User Progress Mutation**: User B attempting to write into `/users/userA/progress/solo-leveling`. Expected: REJECTED.
5. **PII Harvesting on Feedback**: Unauthenticated or normal user attempting `list` on `/feedback`. Expected: REJECTED.
6. **Payload Inflation in Comments**: Posting comment text exceeding 2,000 characters. Expected: REJECTED by length check.
7. **Path Variable ID Poisoning**: Document ID containing directory traversal or junk characters (e.g. `../../admin`). Expected: REJECTED by `isValidId()`.
8. **Malicious Comment Body Alteration**: Non-author attempting to change comment content during upvote. Expected: REJECTED by `affectedKeys().hasOnly(['upvotes'])`.
9. **Unverified Rating Value**: Rating outside the 1 to 5 numeric bounds. Expected: REJECTED.
10. **Negative or Arbitrary Vote Jumps**: Mutating fields other than `upvotes` during upvote action. Expected: REJECTED.
11. **Orphaned Subcollection Writes**: Writing subcollection documents with poisoned parent ID. Expected: REJECTED by `isValidId(userId)`.
12. **Blanket Query Scraping**: Attempting an unrestricted list without userId constraint. Expected: REJECTED.

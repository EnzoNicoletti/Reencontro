# Security Specification — Reencontro

## 1. Data Invariants
1. **PII Isolation**: User email addresses and private account details reside exclusively in `users/{userId}` and can only be read or written by the owning authenticated user (`request.auth.uid == userId`). `list` queries on `users` are strictly denied.
2. **Public Profile Separation**: `publicProfiles/{userId}` contains only non-PII attribution (`displayName`, `photoURL`, approximate `neighborhood`) and can only be created or updated by the owning user.
3. **Report Ownership & State Locking**: A report in `reports/{reportId}` can only be created by an authenticated, email-verified user with `userId == request.auth.uid` and `status == 'active'`. Only the owner can edit or delete the report, and once `status` becomes `'resolved'` (reunited), non-status transitions back to `'active'` or arbitrary edits are guarded by explicit action rules.
4. **Conversation Referential Integrity**: Every conversation in `conversations/{conversationId}` must reference an existing `reports/{reportId}` document, contain exactly 2 `participantIds` including `request.auth.uid`, and can only be read or updated by its participants.
5. **Master Gate on Messages**: Every message in `conversations/{conversationId}/messages/{messageId}` checks the parent `conversations/{conversationId}` document via `get()` to guarantee only current participants can read or send messages, with `senderId == request.auth.uid`.
6. **Temporal & Volumetric Bounds**: `createdAt` and `updatedAt` must match `request.time` (`createdAt` is immutable on update), IDs must match `^[a-zA-Z0-9_\\-]+$`, and all strings/lists have strict size bounds.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Identity Spoofing on Report**: Authenticated user A creates a report with `userId: "user_B"`.
2. **Shadow Field Injection on Report**: User adds `{ "isVerified": true, "featured": true }` to a report creation/update payload.
3. **Unauthenticated Write**: Unauthenticated request tries to create or update a report or conversation.
4. **PII Scraping (`users` list)**: Authenticated user queries `collection(db, "users")` with `getDocs`.
5. **Cross-User PII Read**: User A reads `users/user_B`.
6. **ID Poisoning**: User writes to `reports/invalid$id..with.dots` or a 500-char document ID.
7. **Timestamp Forgery**: User submits `createdAt: new Date("2020-01-01")` instead of `serverTimestamp()`.
8. **Foreign Report Edit/Delete**: User A attempts to update or delete User B's report.
9. **Terminal State Bypass**: User updates a `resolved` report to change `species` or reopen it without allowed action.
10. **Orphan Conversation**: User creates a conversation pointing to a non-existent `reportId`.
11. **Conversation Eavesdropping**: User C (not in `participantIds`) attempts to read `conversations/{id}` or list `conversations/{id}/messages`.
12. **Message Sender Impersonation**: Participant A sends a message with `senderId: "participant_B"`.

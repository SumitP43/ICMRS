# Security Specification & Threat Model

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified if `request.auth.uid == userId`.
2. **Admin Privilege Invariant**: Users cannot self-escalate to `admin` or modify their `role` field arbitrarily. Admin identity is verified against `dp7899899@gmail.com` with `email_verified == true` or `/admins/{userId}` document existence.
3. **Complaint Identity Invariant**: When creating a complaint at `/complaints/{complaintId}`, `complaintId` must be a valid sanitized ID (alphanumeric and dashes, <= 128 chars).
4. **Complaint Mutability Invariant**: Non-admin users cannot alter an existing complaint's immutable creation details (`id`, `createdAt`, `userId`).
5. **State Progression Invariant**: Updates to incident state must be strictly bounded and only authorized officers or admins can assign crews or mark complaints resolved.
6. **Volumetric & Anti-Denial-of-Wallet Invariant**: All string fields are capped in length (titles <= 256 chars, descriptions <= 2048 chars, notes <= 200 items).

## 2. The Dirty Dozen Payloads (Designed to Attack System Invariants)
1. **ID Injection Attack**: Attempting to write a complaint with a 50KB junk string as document ID.
2. **Privilege Escalation**: Citizen attempting to write `{ role: 'admin' }` into their `/users/{userId}` document.
3. **Ghost / Shadow Field Injection**: Sending an unauthorized field `{ __isApproved: true }` in a complaint update.
4. **Unauthenticated Write**: Creating a complaint or user profile without being signed in (`request.auth == null`).
5. **Identity Spoofing**: Signed in as `user_A` but writing a complaint with `userId: 'user_B'`.
6. **Unverified Email Admin Spoof**: Attempting admin operations with `dp7899899@gmail.com` when `email_verified == false`.
7. **Foreign Profile Tampering**: User `user_A` attempting to edit `/users/user_B`.
8. **Immutable Field Tampering**: Modifying `createdAt` or `id` on an existing complaint.
9. **Oversized String Attack**: Submitting a description with 500,000 characters to consume storage.
10. **Terminal State Violation**: Modifying an already resolved complaint without admin permissions.
11. **Arbitrary Collection Write**: Attempting to write to an unmapped path like `/secret_keys/{id}`.
12. **Unauthorized Deletion**: A standard citizen attempting to delete public complaints or administrative records.

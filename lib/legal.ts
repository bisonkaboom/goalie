/**
 * Facts the terms and the privacy policy both state.
 *
 * Shared because the two documents are revised together and cross-reference
 * each other: a date or an address that drifts between them is the kind of
 * inconsistency a reviewer reads as carelessness, and both are pasted into the
 * Google Cloud Console OAuth consent screen alongside the page URLs.
 */

/** Shown as "Last updated" on both documents. Bump when either one changes. */
export const LEGAL_LAST_UPDATED = "September 14, 2026";

/**
 * The published contact address, and the only route for a deletion request
 * while the app has no in-app delete. A per-app address rather than a personal
 * one, so it can be forwarded or reassigned without editing a published policy.
 */
export const LEGAL_CONTACT_EMAIL = "goalie@thepackage.com";

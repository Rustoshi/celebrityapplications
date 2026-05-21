/**
 * Client-side auth helpers — no SessionProvider dependency.
 */

/**
 * Sign out by calling the NextAuth CSRF + signout endpoints directly,
 * then redirect. Works without SessionProvider.
 */
export async function clientSignOut(callbackUrl = "/login") {
  try {
    // Get CSRF token
    const csrfRes = await fetch("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    // Call signout
    await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, callbackUrl }),
    });
  } catch {
    // Even if the API fails, redirect
  }
  window.location.href = callbackUrl;
}

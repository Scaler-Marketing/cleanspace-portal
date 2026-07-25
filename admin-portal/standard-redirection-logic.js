(function () {
  // The Wized configurator previews the site under server.wized.com / ss.wized.com /
  // localhost:3000. There, document.cookie is scoped to the Wized origin, not the app,
  // so auth_token reads as missing even when it exists — and localStorage.clear() below
  // would wipe Wized's own token store (it keeps c.auth_token in localStorage in the
  // configurator). Auth-gating a design-time preview is pointless, so bail out entirely
  // inside the configurator. Staging/production origins don't match, so real auth-gating
  // still runs there.
  const origin = window.location.origin;
  if (
    origin.includes("server.wized.com") ||
    origin.includes("ss.wized.com") ||
    origin.includes("localhost:3000")
  ) {
    return;
  }

  // Function to get cookie value by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // Function to redirect user
  function redirectTo(path) {
    if (window.location.origin.includes("server.wized.com")) {
      // We're in Wized preview - use Wized's navigation
      window.Wized = window.Wized || [];
      window.Wized.push((Wized) => {
        Wized.data.n.path = path;
      });
    } else {
      // Normal redirect
      window.location.href = path;
    }
  }

  // Check admin authentication status
  const adminAuthToken = getCookie("auth_token");

  if (!adminAuthToken) {
    // No admin auth token - clear all localStorage and redirect to admin login
    localStorage.clear();
    redirectTo("/");
  }
  // If admin token exists, allow access to current page (no redirect needed)
})();

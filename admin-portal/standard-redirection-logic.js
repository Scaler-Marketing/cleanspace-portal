(function () {
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

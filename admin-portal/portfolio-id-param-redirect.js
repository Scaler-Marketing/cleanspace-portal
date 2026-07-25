(function() {
  // Function to redirect user
  function redirectTo(path) {
    if (window.location.origin.includes('server.wized.com')) {
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

  // Check for playbook_id parameter
  if (window.location.origin.includes('server.wized.com')) {
    // In Wized preview - wait for Wized to be ready
    window.Wized = window.Wized || [];
    window.Wized.push((Wized) => {
      const experimentId = Wized.data.n.parameter.portfolio_id;
      
      if (!experimentId) {
        // Missing portfolio_id parameter - redirect to all playbooks
        redirectTo('/admin-portal/portfolio/all');
      }
      // If project_id exists, allow access to current page
    });
  } else {
    // Normal environment - check URL parameters directly
    const urlParams = new URLSearchParams(window.location.search);
    const experimentId = urlParams.get('portfolio_id');
    
    if (!experimentId) {
      // Missing portfolio_id parameter - redirect to all portfolio
      redirectTo('/admin-portal/portfolio/all');
    }
    // If portfolio_id exists, allow access to current page
  }
})();

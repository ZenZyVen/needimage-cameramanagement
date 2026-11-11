import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Automatically scrolls window, body, html, and main container to top (0, 0)
 * whenever the route pathname changes, ensuring every page opens cleanly at the top.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Window scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Document elements
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTop = 0;
    }

    // Container elements
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainContent.scrollTop = 0;
    }

    const pageBody = document.querySelector('.page-body');
    if (pageBody) {
      pageBody.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      pageBody.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;

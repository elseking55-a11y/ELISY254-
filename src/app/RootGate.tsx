import { Navigate } from 'react-router-dom';
import Landing from '../pages/landing';

/**
 * Renders at '/'. Deriv's OAuth redirect_uri is registered as the bare
 * domain root for every white-label site, so login callbacks always land
 * here first — this must keep working exactly as before.
 *
 * - The public root always opens the landing page.
 * - Only a genuine OAuth callback is forwarded to /app, so refreshing the
 *   website does not silently reopen the trading workspace.
 */
const RootGate = () => {
    const params = new URLSearchParams(window.location.search);
    const isOAuthCallback = params.has('code') || params.has('acct1') || params.has('error');
    if (isOAuthCallback) {
        return <Navigate to={`/app${window.location.search}${window.location.hash}`} replace />;
    }

    return <Landing />;
};

export default RootGate;

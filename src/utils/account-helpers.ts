// Account and device utility functions
// Moved from src/analytics/utils.ts during analytics cleanup

export const MAX_MOBILE_WIDTH = 926;
export const ACCOUNT_TYPE_KEY = 'account_type';

// Cosmetic admin presentation account. This does NOT change Deriv account data,
// login IDs, balances, trading permissions, or the account type returned by Deriv.
export const ELISY_ADMIN_ACCOUNT_ID = '01a092e9-5de2-7be1-864a-ea3f18d478bf';

// The admin's current Demo trading login is used as a presentation-only fallback.
// It never changes the underlying Deriv account type or trading connection.
export const ELISY_ADMIN_DEMO_LOGINID = 'DOT94513037';

export const isElisyAdminAccount = (...identifiers: Array<unknown>): boolean => {
    const adminId = ELISY_ADMIN_ACCOUNT_ID.toLowerCase();
    const containsAdminId = (value: unknown, depth = 0): boolean => {
        if (depth > 5 || value === null || value === undefined) return false;

        if (typeof value === 'string' || typeof value === 'number') {
            const textValue = String(value).trim();
            if (textValue.toLowerCase() === adminId || textValue.toLowerCase() === ELISY_ADMIN_DEMO_LOGINID.toLowerCase()) return true;

            // OAuth/session data can contain the profile identifier inside a JWT
            // claim or a JSON string. Inspect only the decoded payload/JSON value.
            try {
                const parsed = JSON.parse(textValue);
                if (parsed !== textValue && containsAdminId(parsed, depth + 1)) return true;
            } catch {
                // Not JSON; continue.
            }

            const jwtParts = textValue.split('.');
            if (jwtParts.length === 3) {
                try {
                    const payload = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
                    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
                    const decoded = decodeURIComponent(
                        atob(padded)
                            .split('')
                            .map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    );
                    if (containsAdminId(JSON.parse(decoded), depth + 1)) return true;
                } catch {
                    // Opaque access token or non-JWT value; ignore it.
                }
            }
            return false;
        }

        if (Array.isArray(value)) {
            return value.some(item => containsAdminId(item, depth + 1));
        }

        if (typeof value === 'object') {
            return Object.values(value as Record<string, unknown>).some(item => containsAdminId(item, depth + 1));
        }

        return false;
    };

    return identifiers.some(value => containsAdminId(value));
};

/**
 * Returns the account type to PRESENT in the ELISY254 UI for the admin only.
 * The underlying Deriv account type must always continue using isDemoAccount().
 */
/**
 * Admin presentation is automatic. When the authenticated identity matches the
 * configured ELISY admin profile, the UI presents the active account as Real.
 * This is cosmetic only: the actual Deriv account type is never changed.
 */
export const getPresentationIsVirtual = (loginid?: string, adminPresentation = false): boolean => {
    if (!loginid) return false;
    return adminPresentation ? false : isDemoAccount(loginid);
};

/**
 * Check if a loginid represents a demo account
 * Demo accounts have specific prefixes:
 * - VRTC: Classic demo accounts
 * - VRW: Demo wallet accounts
 * - DEM: Demo accounts with DEM prefix
 * - DOT: Demo accounts with DOT prefix
 *
 * @param loginid - The account loginid to check
 * @returns true if demo account, false otherwise
 */
export const isDemoAccount = (loginid: string): boolean => {
    if (!loginid) return false;

    return (
        loginid.startsWith('VRTC') ||
        loginid.startsWith('VRW') ||
        loginid.startsWith('DEM') ||
        loginid.startsWith('DOT')
    );
};

export const USD_ICON_DEMO_LOGINIDS = ['DOT91317422', 'DOT93418180', 'DOT91360536'];

export const shouldShowUsdAccountIcon = (loginid: string): boolean => {
    if (!loginid) return false;
    if (USD_ICON_DEMO_LOGINIDS.includes(loginid)) return true;
    return !isDemoAccount(loginid);
};

export const getDisplayLoginId = (loginid: string): string => loginid || '';

export const getDisplayMaskedLoginId = (maskedLoginId: string): string => maskedLoginId || '';

export const getMaskedLoginId = (loginid: string): string => {
    if (!loginid) return '';
    const value = String(loginid);
    const mask = '****';

    if (value.length <= 6) {
        return `${value.slice(0, 2)}${mask}`;
    }

    return `${value.slice(0, 2)}${mask}${value.slice(-4)}`;
};

export const getJournalAccountLabel = (loginid: string, currency?: string): string | undefined => {
    if (!loginid) return currency;

    return isDemoAccount(loginid) ? 'Demo' : currency;
};

/**
 * Get account type based on loginid and localStorage
 * This is the centralized function for determining account type
 * Loginid is the primary source of truth when provided
 *
 * @param loginid - Optional loginid to check (if not provided, uses localStorage only)
 * @returns 'demo' or 'real' or 'public' if cannot determine
 */
export const getAccountType = (loginid?: string): string | undefined => {
    try {
        // If loginid is provided, use it as the source of truth
        if (loginid) {
            return isDemoAccount(loginid) ? 'demo' : 'real';
        }

        // Only fallback to public when loginid is not available
        return 'public';
    } catch (error) {
        // Handle cases where localStorage is not available (SSR, private browsing, etc.)
        return 'public';
    }
};

/**
 * Gets account_id with priority: URL parameter > localStorage > null
 * @returns account_id string or null
 */
export const getAccountId = (): string | null => {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const accountIdFromUrl = urlParams.get('account_id');

    const tokenFromUrl = urlParams.get('token');
    // Remove token from URL if present
    if (tokenFromUrl) {
        removeUrlParameter('token');
    }

    if (accountIdFromUrl) {
        // Store account ID in localStorage for future use
        localStorage.setItem('active_loginid', accountIdFromUrl);
        // Remove from URL after storing
        removeUrlParameter('account_id');
        // Return the account ID immediately as it takes precedence over localStorage
        return accountIdFromUrl;
    }

    // 2. Check localStorage
    return localStorage.getItem('active_loginid');
};

/**
 * Check if current account is virtual/demo
 * Loginid is the primary source of truth - if provided and valid, it takes precedence
 * Only falls back to localStorage when loginid is not available or empty
 *
 * @param loginid - The account loginid to check
 * @returns true if demo/virtual account, false otherwise
 */
export const isVirtualAccount = (loginid: string): boolean => {
    // If loginid is provided and valid, use it as the source of truth
    if (loginid) {
        return isDemoAccount(loginid);
    }

    // Only fallback to localStorage when loginid is not available
    try {
        const savedAccountType = localStorage.getItem(ACCOUNT_TYPE_KEY);
        return savedAccountType === 'demo';
    } catch (error) {
        return false;
    }
};

/**
 * Get device type based on screen width
 * @returns 'mobile' or 'desktop'
 */
export const getDeviceType = () => {
    // SSR safety check and use constant for breakpoint
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth <= MAX_MOBILE_WIDTH ? 'mobile' : 'desktop';
};

/**
 * Removes a parameter from the current URL without page reload
 * @param paramName - The name of the parameter to remove
 */
export const removeUrlParameter = (paramName: string): void => {
    const url = new URL(window.location.href);
    url.searchParams.delete(paramName);
    window.history.replaceState({}, document.title, url.toString());
};

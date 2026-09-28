import { useEffect, useMemo, useState } from 'react';
/* [AI] - Analytics removed - utility functions moved to @/utils/account-helpers */
import {
    ADMIN_PRESENTATION_EVENT,
    getAdminPresentationMode,
    getPresentationIsVirtual,
    isElisyAdminAccount,
    isVirtualAccount,
    shouldShowUsdAccountIcon,
} from '@/utils/account-helpers';
/* [/AI] */
import { CurrencyIcon } from '@/components/currency/currency-icon';
import { addComma, getDecimalPlaces } from '@/components/shared';
import { useApiBase } from '@/hooks/useApiBase';
import { Balance } from '@deriv/api-types';

/** A custom hook that returns the account object for the current active account. */
const useActiveAccount = ({
    allBalanceData,
    directBalance,
}: {
    allBalanceData: Balance | null;
    directBalance?: string;
}) => {
    const { accountList, activeLoginid, authData } = useApiBase();

    const authRecord = (authData && typeof authData === 'object' ? authData : {}) as Record<string, unknown>;
    const persistedAdminLoginid =
        typeof window !== 'undefined' ? localStorage.getItem('elisy_admin_presentation_loginid') : null;
    const isAdminPresentation =
        isElisyAdminAccount(
            activeLoginid,
            authRecord.account_id,
            authRecord.account_number,
            authRecord.accountNumber,
            authRecord.accountId,
            authRecord.id,
            authRecord.user_id,
            authRecord.userId,
            authRecord.profile_id,
            authRecord.profileId,
            authRecord.uuid,
            authRecord.user_uuid,
            authRecord.profile,
            authRecord.account
        ) || Boolean(activeLoginid && persistedAdminLoginid === activeLoginid);

    const [presentationMode, setPresentationMode] = useState(() =>
        isAdminPresentation ? 'real' : getAdminPresentationMode(activeLoginid)
    );

    useEffect(() => {
        if (!isAdminPresentation) return;

        const syncPresentationMode = () => {
            setPresentationMode('real');
        };

        syncPresentationMode();
        window.addEventListener(ADMIN_PRESENTATION_EVENT, syncPresentationMode);
        return () => window.removeEventListener(ADMIN_PRESENTATION_EVENT, syncPresentationMode);
    }, [activeLoginid, isAdminPresentation]);

    const activeAccount = useMemo(
        () => accountList?.find(account => account.loginid === activeLoginid),
        [activeLoginid, accountList]
    );

    const currentBalanceData = allBalanceData?.accounts?.[activeAccount?.loginid ?? ''];

    const modifiedAccount = useMemo(() => {
        if (!activeAccount) return undefined;

        // Deriv's account type remains the source of truth for trading.
        // Admin presentation may only change what the header displays.
        const actualIsVirtual = isVirtualAccount(activeAccount.loginid);
        const isVirtual = getPresentationIsVirtual(
            activeAccount.loginid,
            isAdminPresentation,
            presentationMode
        );

        return {
            ...activeAccount,
            balance: currentBalanceData?.balance
                ? addComma(currentBalanceData.balance.toFixed(getDecimalPlaces(currentBalanceData.currency)))
                : directBalance
                  ? addComma(parseFloat(directBalance).toFixed(getDecimalPlaces(activeAccount.currency)))
                  : addComma(parseFloat('0').toFixed(getDecimalPlaces(activeAccount.currency))),
            currencyLabel: isVirtual ? 'Demo' : activeAccount?.currency,
            icon: (
                <CurrencyIcon
                    currency={isAdminPresentation || shouldShowUsdAccountIcon(activeAccount.loginid) ? 'usd' : undefined}
                    isVirtual={!isAdminPresentation && !shouldShowUsdAccountIcon(activeAccount.loginid)}
                />
            ),
            isVirtual: isVirtual,
            // Keep the actual Deriv type available to consumers that need it;
            // `isVirtual` above is the header presentation value only.
            actualIsVirtual,
            isActive: activeAccount?.loginid === activeLoginid,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
            activeAccount,
            activeLoginid,
            allBalanceData,
            directBalance,
            authData,
            isAdminPresentation,
            presentationMode,
        ]);

    return {
        /** User's current active account. */
        data: modifiedAccount,
    };
};

export default useActiveAccount;

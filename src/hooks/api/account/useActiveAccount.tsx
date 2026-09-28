import { useEffect, useMemo, useState } from 'react';
/* [AI] - Analytics removed - utility functions moved to @/utils/account-helpers */
import {
    getPresentationIsVirtual,
    isElisyAdminAccount,
    isVirtualAccount,
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
    const storedIdentityValues: unknown[] =
        typeof window !== 'undefined'
            ? Array.from({ length: localStorage.length }, (_, index) => localStorage.getItem(localStorage.key(index) || ''))
                  .concat(
                      Array.from({ length: sessionStorage.length }, (_, index) =>
                          sessionStorage.getItem(sessionStorage.key(index) || '')
                      )
                  )
                  .filter(Boolean)
            : [];

    const isAdminPresentation =
        isElisyAdminAccount(
            activeLoginid,
            authRecord,
            storedIdentityValues
        ) || Boolean(activeLoginid && persistedAdminLoginid === activeLoginid);

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
            isAdminPresentation
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
                    currency={!actualIsVirtual || isAdminPresentation ? 'usd' : undefined}
                    isVirtual={actualIsVirtual && !isAdminPresentation}
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
        ]);

    return {
        /** User's current active account. */
        data: modifiedAccount,
    };
};

export default useActiveAccount;

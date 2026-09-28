declare module '@deriv/stores/types' {
    export type TNotificationMessage = {
        key?: string;
        header?: string;
        message?: string;
        type?: string;
        is_persistent?: boolean;
        is_disposable?: boolean;
        platform?: string;
        action?: {
            text: string;
            onClick: () => void;
        };
    };

    export type TStores = {
        client: any;
        common: any;
        ui: any;
    };

    export type TPortfolioPosition = any;
}

declare module 'Types' {
    export type TDbot = any;
}

declare module '@deriv-com/translations' {
    export const Localize: (props: { i18n_default_text: string; values?: Record<string, string> }) => JSX.Element;
    export const TranslationProvider: (props: { children: React.ReactNode }) => JSX.Element;
    export const getAllowedLanguages: () => Record<string, string>;
    export const getInitialLanguage: () => string;
    export const initializeI18n: (...args: unknown[]) => unknown;
    export const localize: (text: string, ...args: unknown[]) => string;
    export const loadIncontextTranslation: (...args: unknown[]) => unknown;
    export const useTranslations: () => { localize: (text: string, ...args: unknown[]) => string; currentLang: string };
}

declare module '@deriv-com/utils' {
    export const BrandConstants: {
        platforms: {
            dBot: string;
            [key: string]: string;
        };
    };
}

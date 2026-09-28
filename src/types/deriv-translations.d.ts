declare module '@deriv-com/translations' {
    import type { ComponentType, ReactNode } from 'react';

    export const initializeI18n: (...args: any[]) => any;
    export const localize: (key: string, options?: Record<string, unknown>) => string;
    export const getInitialLanguage: (...args: any[]) => string;
    export const useTranslations: (...args: any[]) => any;
    export const TranslationProvider: ComponentType<{ children: ReactNode; [key: string]: unknown }>;
    export const Localize: ComponentType<Record<string, unknown>>;
}

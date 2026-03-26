import i18n from '@/app/i18n/i18n';

export const useTranslation = () => ({
  t: (key: string, options?: Record<string, string>) => i18n.t(key, options),
  i18n,
});

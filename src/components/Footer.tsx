import { useI18n } from '../lib/i18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full bg-black text-white py-4 px-4 sm:px-6 lg:px-8 flex justify-center items-center shadow">
      <span className="text-sm sm:text-base text-center">{t('footer.rights')}</span>
    </footer>
  );
}
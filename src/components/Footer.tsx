import { useI18n } from '../lib/i18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full bg-black text-white py-4 px-8 flex justify-center items-center shadow">
      <span>{t('footer.rights')}</span>
    </footer>
  );
}
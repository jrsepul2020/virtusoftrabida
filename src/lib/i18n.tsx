import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'es' | 'en';

type Messages = Record<string, string>;

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const messages: Record<Lang, Messages> = {
  es: {
    // Inscripción - Empresa
    'form.company.title': 'Datos de la Empresa / Bodega',
    'form.company.nif': 'NIF *',
    'form.company.name': 'Nombre de la Empresa *',
    'form.company.contact': 'Persona de Contacto *',
    'form.company.phone': 'Teléfono *',
    'form.company.mobile': 'Móvil *',
    'form.company.email': 'Email *',
    'form.company.confirm_email': 'Confirmar Email *',
    'form.company.address': 'Dirección *',
    'form.company.city': 'Población *',
    'form.company.postal': 'Código Postal *',
    'form.company.country': 'País *',
    'form.company.website': 'Página Web',
    'form.company.medium': '¿A través de qué medio nos conoció? *',
    'form.company.medium.placeholder': 'Ej. Web, Email, Redes Sociales',
    'form.company.observations': 'Observaciones',
    'form.required': 'Obligatorio',

    // Inscripción - Muestras
    'form.samples.title': 'Datos de las Muestras ({count})',
    'form.samples.registered': 'Muestras registradas',
    'form.sample.name': 'Nombre de la Muestra *',
    'form.sample.photo': 'Foto de la Botella (Opcional)',
    'form.sample.category': 'Categoría *',
    'form.sample.country': 'País *',
    'form.sample.year': 'Año / Añada *',
    'form.sample.sugar': 'Azúcar (g/l) *',
    'form.sample.degree': 'Grado Alcohólico (%) *',
    'form.sample.stock': 'Existencias (botellas) *',
    // Placeholders y labels adicionales para muestras
    'form.sample.item': 'Muestra #{n}',
    'form.sample.category.select': 'Seleccionar categoría...',
    'placeholder.sample.name': 'Introduzca el nombre de la muestra',
    'placeholder.sample.country': 'País de origen',
    'placeholder.sample.region': 'Región de origen',
    'placeholder.sample.igp': 'Indicación Geográfica Protegida',
    'placeholder.sample.sugar': 'Ej: 12.5 o 12,5',
    'placeholder.sample.degree': 'Ej: 13.5 o 13,5',
    'placeholder.sample.variety': 'Variedad de uva',
    'placeholder.sample.olive_variety': 'Variedad de aceituna',
    'placeholder.sample.distilled': 'Tipo de destilado',
    'placeholder.sample.stock': 'Número de botellas',
    'form.sample.origin': 'Origen',
    'form.sample.igp': 'IGP',
    'form.sample.grape_type': 'Tipo de Uva',
    'form.sample.olive_type': 'Tipo de Aceituna',
    'form.sample.distillate': 'Destilado',
    'form.sample.year.select': 'Seleccionar año...',

    // Confirmación
    'form.confirm.title': 'Confirmación de inscripción',
    'form.confirm.review': 'Revisa y confirma los datos de tu inscripción',

    // Botones
    'button.next': 'Siguiente',
    'button.prev': 'Anterior',
    'button.submit': 'Enviar inscripción',
    'button.backhome': 'Volver al Inicio',
    'loading.sending': 'Enviando...',
    'action.download_pdf': 'Descargar PDF',
    'action.whatsapp': 'WhatsApp',
    'tracking.title': '¿Cómo consultar el estado de mi inscripción?',
    'tracking.copy': 'Copiar',
    'order.number': 'Número de Pedido',
    'success.email_heading': 'Revise su correo electrónico',
    'success.check_email_to': 'Hemos enviado un email a {email} con todos los detalles de su inscripción. Si no lo encuentra, revise la carpeta de spam.',
    // Modal / errores
    'modal.error.fields_required': 'Campos obligatorios',
    'modal.error.fill_required': 'Por favor, complete todos los campos obligatorios marcados con *',
    'modal.error.emails_mismatch': 'Emails no coinciden',
    'modal.error.emails_mismatch_msg': 'El email y su confirmación deben ser iguales',
    'modal.error.samples_required': 'Por favor, complete todos los campos obligatorios de las muestras marcados con *',

    // Payment
    'form.payment.title': 'Selecciona tu método de pago',
    'payment.transfer': 'Transferencia bancaria',
    'payment.transfer.desc': 'Pago tradicional mediante transferencia',
    'payment.paypal': 'Pagar con PayPal',
    'payment.paypal.desc': 'Pago online rápido y seguro',

    // Éxito
    'success.title': '¡Inscripción Realizada con Éxito!',
    'success.check_email': 'Hemos enviado un email con los detalles de su inscripción.',
    'nav.home': 'Inicio',
    'nav.inscripcion': 'Inscripción',
    'nav.reglamento': 'Reglamento',
    'nav.normativa': 'Normativa',
    'nav.resultados': 'Resultados',
    'nav.diplomas': 'Diplomas',
    'nav.label': 'Navegación principal',
    'nav.open': 'Abrir menú',
    'nav.close': 'Cerrar menú',
    'nav.login': 'Login Admin',
    'nav.logout': 'Cerrar Sesión',
    'nav.admin': 'Administrador',
    'hero.title': 'INTERNATIONAL VIRTUS AWARDS',
    'hero.subtitle1': 'LA RABIDA 2026',
    'hero.subtitle2': 'IBEROAMERICANO',
    'hero.cta': '¡INSCRÍBETE AHORA!',
    'hero.tagline.line1': 'CONCURSO INTERNACIONAL DE',
    'hero.tagline.line2': 'VINOS, ESPIRITUOSOS',
    'hero.tagline.line3': 'Y',
    'hero.tagline.line4': 'ACEITE VIRGEN EXTRA',
    'lang.toggle': 'EN',
    'lang.toggle.aria': 'Cambiar a inglés',
    'skip.link': 'Saltar al contenido principal',
    'footer.rights': '© 2025 International Virtus Awards. Todos los derechos reservados.',
    // Empresa screen notes and labels
    'company.note.line1': 'Realice su inscripción sin límite de muestras. Cada muestra tiene un coste de {price} €. Envíe {bottles} botellas por muestra.',
    'company.note.line2': 'Por cada {per} muestras inscritas, una es GRATIS.',
    'label.num_samples': 'Nº de muestras',
    'company.min_samples': 'Mínimo 1 muestra',
    'company.samples_summary_line': '{n} muestra(s) total',
    'company.free_samples_celebration': '🎉 {n} muestra(s) gratis! ',
    'admin.manual.title': '🏷️ Inscripción Manual',
    'admin.automatic.title': '💻 Inscripción Automática',
    'admin.manual.description': 'Se generarán códigos únicos (1-999) para cada muestra',
    'admin.automatic.description': 'Inscripción estándar sin códigos especiales',
    'admin.manual.features_title': 'Características de la inscripción manual:',
    'admin.manual.features.item1': 'Se asignará un código único del 1 al 999 a cada muestra',
    'admin.manual.features.item2': 'La inscripción se marcará como "manual" en la base de datos',
    'admin.manual.features.item3': 'Ideal para inscripciones presenciales o telefónicas',
    'support.contact_label': 'Soporte / Ayuda inscripción:',
    // Step labels
    'step.empresa': 'Empresa',
    'step.muestras': 'Muestras',
    'step.confirmacion': 'Confirmación',
    // Resumen y pagos
    'summary.payment.title': 'Resumen de Pago',
    'summary.pay_label': 'Muestras a pagar:',
    'summary.free_label': 'Muestras gratis:',
    'summary.total_label': 'Total:',
    'transfer.details_title': '📋 Datos para la transferencia:',
    'summary.payment_method_label': 'Método de pago:',
    // Tracking / post-success copy
    'tracking.intro': 'Puede consultar el estado de su inscripción en cualquier momento:',
    'tracking.step1': 'Para cualquier consulta sobre su inscripción, contacte con nosotros por email o teléfono: {email} o {phone}',
    'tracking.step2': 'Proporcione siempre su código de seguimiento #{pedido} para agilizar la consulta',
    'tracking.step3': 'Le informaremos del estado de pago, recepción de muestras y fechas del concurso por email',
    'tracking.tip': '💡 Consejo: Guarde este código junto con el email de confirmación. Lo necesitará para cualquier consulta sobre su inscripción.',
    // Generic labels
    'label.company': 'Empresa',
    'label.nif': 'NIF',
    'label.contact_person': 'Persona de contacto',
    'label.email': 'Email',
    'label.phone': 'Teléfono',
    'label.address': 'Dirección',
    'label.web': 'Web',
    'label.country': 'País',
    'label.city': 'Ciudad',
    'label.postal': 'C.P.',
    // Pagos - ES
    'payment.select_title': 'Selecciona tu método de pago',
    'payment.company_label': 'Empresa',
    'payment.company_email': 'Email',
    'payment.total_samples_label': 'Total de muestras:',
    'payment.discount_applied': '¡Descuento aplicado! {info}',
    'payment.total_to_pay': 'Total a pagar',
    'payment.bank.title': 'Transferencia Bancaria',
    'payment.bank.desc': 'Realiza el pago mediante transferencia a nuestra cuenta bancaria',
    'payment.paypal.title': 'PayPal',
    'payment.paypal.desc': 'Pago rápido y seguro con PayPal o tarjeta de crédito',
    'payment.bank.details_title': 'Datos para Transferencia Bancaria',
    'payment.bank.holder': 'Titular de la cuenta',
    'payment.bank.name': 'Banco',
    'payment.bank.iban': 'IBAN',
    'payment.bank.swift': 'BIC/SWIFT',
    'payment.concept_label': 'Concepto',
    'payment.amount_label': 'Importe',
    'payment.important_label': 'Importante:',
    'payment.important_text': 'Por favor, incluye el nombre de tu empresa ({company}) en el concepto de la transferencia para poder identificar tu pago correctamente.',
    'payment.change_method': 'Cambiar método',
    'payment.confirm_finish': 'Confirmar y finalizar',
    'payment.paypal.title_header': 'Pago con PayPal',
    'payment.paypal.amount_label': 'Importe a pagar:',
    'payment.paypal.redirect_text': 'Serás redirigido a PayPal para completar el pago de forma segura',
    'payment.paypal.error_alert': 'Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.',
    'payment.change_method_full': 'Cambiar método de pago',
    'payment.success.title': '¡Pago Completado!',
    'payment.success.message': 'Tu pago ha sido procesado exitosamente. Recibirás un correo de confirmación pronto.',
    'payment.success.backhome': 'Volver al inicio',
  },
  en: {
    // Inscripción - Empresa
    'form.company.title': 'Company / Winery Details',
    'form.company.nif': 'Tax ID *',
    'form.company.name': 'Company Name *',
    'form.company.contact': 'Contact Person *',
    'form.company.phone': 'Phone *',
    'form.company.mobile': 'Mobile *',
    'form.company.email': 'Email *',
    'form.company.confirm_email': 'Confirm Email *',
    'form.company.address': 'Address *',
    'form.company.city': 'City *',
    'form.company.postal': 'Postal Code *',
    'form.company.country': 'Country *',
    'form.company.website': 'Website',
    'form.company.medium': 'How did you hear about us? *',
    'form.company.medium.placeholder': 'e.g. Web, Email, Social Media',
    'form.company.observations': 'Notes',
    'form.required': 'Required',

    // Inscripción - Samples
    'form.samples.title': 'Sample Details ({count})',
    'form.samples.registered': 'Registered Samples',
    'form.sample.name': 'Sample Name *',
    'form.sample.photo': 'Bottle Photo (Optional)',
    'form.sample.category': 'Category *',
    'form.sample.country': 'Country *',
    'form.sample.year': 'Year / Vintage *',
    'form.sample.sugar': 'Sugar (g/l) *',
    'form.sample.degree': 'Alcohol % *',
    'form.sample.stock': 'Stock (bottles) *',
    // Additional placeholders and labels for samples
    'form.sample.item': 'Sample #{n}',
    'form.sample.category.select': 'Select category...',
    'placeholder.sample.name': 'Enter sample name',
    'placeholder.sample.country': 'Country of origin',
    'placeholder.sample.region': 'Region of origin',
    'placeholder.sample.igp': 'Protected Geographical Indication',
    'placeholder.sample.sugar': 'Eg: 12.5',
    'placeholder.sample.degree': 'Eg: 13.5',
    'placeholder.sample.variety': 'Grape variety',
    'placeholder.sample.olive_variety': 'Olive variety',
    'placeholder.sample.distilled': 'Type of distillate',
    'placeholder.sample.stock': 'Number of bottles',
    'form.sample.origin': 'Origin',
    'form.sample.igp': 'PGI',
    'form.sample.grape_type': 'Grape Type',
    'form.sample.olive_type': 'Olive Type',
    'form.sample.distillate': 'Distillate',
    'form.sample.year.select': 'Select year...',

    // Confirmation
    'form.confirm.title': 'Registration Confirmation',
    'form.confirm.review': 'Please review and confirm your registration details',

    // Buttons
    'button.next': 'Next',
    'button.prev': 'Back',
    'button.submit': 'Submit Registration',
    'button.backhome': 'Back to Home',
    'loading.sending': 'Sending...',
    'action.download_pdf': 'Download PDF',
    'action.whatsapp': 'WhatsApp',
    'tracking.title': 'How to check the status of my registration?',
    'tracking.copy': 'Copy',
    'order.number': 'Order Number',
    'success.email_heading': 'Check your email',
    'success.check_email_to': 'We have sent an email to {email} with your registration details. If you do not see it, check your spam folder.',
    // Modal / errors
    'modal.error.fields_required': 'Required fields',
    'modal.error.fill_required': 'Please complete all required fields marked with *',
    'modal.error.emails_mismatch': 'Emails do not match',
    'modal.error.emails_mismatch_msg': 'The email and its confirmation must be identical',
    'modal.error.samples_required': 'Please complete all required sample fields marked with *',

    // Payment
    'form.payment.title': 'Select your payment method',
    'payment.transfer': 'Bank transfer',
    'payment.transfer.desc': 'Traditional payment via bank transfer',
    'payment.paypal': 'Pay with PayPal',
    'payment.paypal.desc': 'Fast and secure online payment',

    // Success
    'success.title': 'Registration Completed Successfully!',
    'success.check_email': 'We have sent an email with your registration details.',
    'nav.home': 'Home',
    'nav.inscripcion': 'Registration',
    'nav.reglamento': 'Rules',
    'nav.normativa': 'Regulations',
    'nav.resultados': 'Results',
    'nav.diplomas': 'Diplomas',
    'nav.label': 'Main navigation',
    'nav.open': 'Open menu',
    'nav.close': 'Close menu',
    'nav.login': 'Admin Login',
    'nav.logout': 'Log Out',
    'nav.admin': 'Administrator',
    'hero.title': 'INTERNATIONAL VIRTUS AWARDS',
    'hero.subtitle1': 'LA RABIDA 2026',
    'hero.subtitle2': 'IBERO-AMERICAN',
    'hero.cta': 'REGISTER NOW!',
    'hero.tagline.line1': 'INTERNATIONAL COMPETITION OF',
    'hero.tagline.line2': 'WINES & SPIRITS',
    'hero.tagline.line3': 'AND',
    'hero.tagline.line4': 'EXTRA VIRGIN OLIVE OIL',
    'lang.toggle': 'ES',
    'lang.toggle.aria': 'Switch to Spanish',
    'skip.link': 'Skip to main content',
    'footer.rights': '© 2025 International Virtus Awards. All rights reserved.',
    // Company screen notes and labels
    'company.note.line1': 'Submit unlimited samples. Each sample costs {price} €. Send {bottles} bottles per sample.',
    'company.note.line2': 'For every {per} samples registered, one is FREE.',
    'label.num_samples': 'No. of samples',
    'company.min_samples': 'Minimum 1 sample',
    'company.samples_summary_line': '{n} sample(s) total',
    'company.free_samples_celebration': '🎉 {n} free sample(s)!',
    'admin.manual.title': '🏷️ Manual Registration',
    'admin.automatic.title': '💻 Automatic Registration',
    'admin.manual.description': 'Unique codes (1-999) will be generated for each sample',
    'admin.automatic.description': 'Standard registration without special codes',
    'admin.manual.features_title': 'Manual registration features:',
    'admin.manual.features.item1': 'A unique code from 1 to 999 will be assigned to each sample',
    'admin.manual.features.item2': 'The registration will be marked as "manual" in the database',
    'admin.manual.features.item3': 'Ideal for on-site or telephone registrations',
    'support.contact_label': 'Support / Registration help:',
    // Step labels
    'step.empresa': 'Company',
    'step.muestras': 'Samples',
    'step.confirmacion': 'Confirmation',
    // Summary and payments
    'summary.payment.title': 'Payment Summary',
    'summary.pay_label': 'Samples to pay:',
    'summary.free_label': 'Free samples:',
    'summary.total_label': 'Total:',
    'transfer.details_title': '📋 Transfer details:',
    'summary.payment_method_label': 'Payment method:',
    // Tracking / post-success copy
    'tracking.intro': 'You can check the status of your registration at any time:',
    'tracking.step1': 'For any inquiry about your registration, contact us by email or phone: {email} or {phone}',
    'tracking.step2': 'Always provide your tracking code #{pedido} to speed up the inquiry',
    'tracking.step3': 'We will inform you of payment status, sample reception and competition dates by email',
    'tracking.tip': '💡 Tip: Save this code along with the confirmation email. You will need it for any inquiry about your registration.',
    // Generic labels
    'label.company': 'Company',
    'label.nif': 'Tax ID',
    'label.contact_person': 'Contact person',
    'label.email': 'Email',
    'label.phone': 'Phone',
    'label.address': 'Address',
    'label.web': 'Website',
    'label.country': 'Country',
    'label.city': 'City',
    'label.postal': 'Postal code',
    // Payments - EN
    'payment.select_title': 'Select your payment method',
    'payment.company_label': 'Company',
    'payment.company_email': 'Email',
    'payment.total_samples_label': 'Total samples:',
    'payment.discount_applied': 'Discount applied! {info}',
    'payment.total_to_pay': 'Total to pay',
    'payment.bank.title': 'Bank Transfer',
    'payment.bank.desc': 'Make the payment via bank transfer to our account',
    'payment.paypal.title': 'PayPal',
    'payment.paypal.desc': 'Fast and secure payment with PayPal or credit card',
    'payment.bank.details_title': 'Bank Transfer Details',
    'payment.bank.holder': 'Account holder',
    'payment.bank.name': 'Bank',
    'payment.bank.iban': 'IBAN',
    'payment.bank.swift': 'BIC/SWIFT',
    'payment.concept_label': 'Concept',
    'payment.amount_label': 'Amount',
    'payment.important_label': 'Important:',
    'payment.important_text': 'Please include your company name ({company}) in the transfer reference so we can identify your payment correctly.',
    'payment.change_method': 'Change method',
    'payment.confirm_finish': 'Confirm and finish',
    'payment.paypal.title_header': 'Pay with PayPal',
    'payment.paypal.amount_label': 'Amount to pay:',
    'payment.paypal.redirect_text': 'You will be redirected to PayPal to complete the payment securely',
    'payment.paypal.error_alert': 'There was an error processing the payment. Please try again.',
    'payment.change_method_full': 'Change payment method',
    'payment.success.title': 'Payment Completed!',
    'payment.success.message': 'Your payment has been processed successfully. You will receive a confirmation email shortly.',
    'payment.success.backhome': 'Back to home',
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang');
    return stored === 'en' ? 'en' : 'es';
  });

  const setLang = (value: Lang) => {
    setLangState(value);
    localStorage.setItem('lang', value);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string) => messages[lang][key] ?? key;

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

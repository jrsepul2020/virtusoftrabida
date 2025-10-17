import SibApiV3Sdk from 'sib-api-v3-sdk';

// Inicializar Brevo con tu API Key segura (usa variables de entorno)
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, email, mensaje } = req.body;

  // Email para el administrador
  const adminEmail = {
    sender: { name: 'Formulario Web', email: 'no-reply@tudominio.com' },
    to: [{ email: 'admin@tudominio.com', name: 'Administrador' }],
    subject: `Nuevo mensaje de ${nombre}`,
    htmlContent: `
      <h3>Nuevo contacto desde la web</h3>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje}</p>
    `,
  };

  // Email para el cliente
  const userEmail = {
    sender: { name: 'Tu Empresa', email: 'no-reply@tudominio.com' },
    to: [{ email, name: nombre }],
    subject: 'Hemos recibido tu mensaje',
    htmlContent: `
      <p>Hola ${nombre},</p>
      <p>Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.</p>
      <br>
      <p>Saludos,<br>Equipo de Tu Empresa</p>
    `,
  };

  try {
    await emailApi.sendTransacEmail(adminEmail);
    await emailApi.sendTransacEmail(userEmail);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

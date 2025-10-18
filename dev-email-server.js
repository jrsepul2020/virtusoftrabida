// Endpoint de desarrollo local para probar emails
// Solo funciona con npm run dev
import express from 'express';

const router = express.Router();

// Simulador de envío de emails para desarrollo local
router.post('/api/send-inscription-email', async (req, res) => {
  console.log('🧪 EMAIL TEST ENDPOINT - DESARROLLO LOCAL');
  console.log('📧 Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  const { empresa, muestras, precio, metodoPago } = req.body;
  
  if (!empresa || !empresa.email || !empresa.nombre_empresa) {
    return res.status(400).json({ error: 'Missing empresa data' });
  }

  // Simular delay de envío
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simular respuesta de éxito
  console.log('✅ Simulando envío exitoso de emails');
  console.log(`📬 Email simulado enviado a: ${empresa.email}`);
  console.log(`📬 Email simulado enviado al admin: jrsepul2000@gmail.com`);
  
  return res.status(200).json({ 
    success: true, 
    message: 'Emails simulados enviados correctamente (desarrollo local)',
    simulation: true,
    empresa: empresa.nombre_empresa,
    muestras: muestras.length,
    destinatarios: [empresa.email, 'jrsepul2000@gmail.com']
  });
});

export default router;
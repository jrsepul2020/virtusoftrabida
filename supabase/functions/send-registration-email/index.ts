import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  companyName: string;
  companyEmail: string;
  contactPerson: string;
  phone?: string;
  samples: Array<{
    codigo: number;
    nombre: string;
    categoria: string;
    pais: string;
  }>;
  totalSamples: number;
  isNewCompany?: boolean;
  tempPassword?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: EmailRequest = await req.json();

    const samplesListHtml = emailData.samples
      .map(
        (sample) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; font-weight: bold; color: #1f2937;">#${sample.codigo}</td>
          <td style="padding: 12px; color: #1f2937;">${sample.nombre}</td>
          <td style="padding: 12px; color: #6b7280;">${sample.categoria || '-'}</td>
          <td style="padding: 12px; color: #6b7280;">${sample.pais || '-'}</td>
        </tr>
      `
      )
      .join("");

    const accountInfoHtml = emailData.isNewCompany && emailData.tempPassword
      ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 8px;">
          <h3 style="color: #92400e; margin-top: 0; margin-bottom: 8px; font-size: 16px;">
            ⚠️ Información importante de acceso
          </h3>
          <p style="color: #78350f; margin: 8px 0;">
            Se ha creado una cuenta para acceder al área de empresas:
          </p>
          <div style="background-color: white; padding: 12px; border-radius: 4px; margin-top: 12px;">
            <p style="margin: 4px 0; color: #1f2937;"><strong>Email:</strong> ${emailData.companyEmail}</p>
            <p style="margin: 4px 0; color: #1f2937;"><strong>Contraseña temporal:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${emailData.tempPassword}</code></p>
          </div>
          <p style="color: #78350f; margin: 12px 0 0 0; font-size: 14px;">
            Por favor, guarde esta información de forma segura. Podrá cambiar su contraseña después de iniciar sesión.
          </p>
        </div>
      `
      : "";

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Inscripción</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">✅ Inscripción Confirmada</h1>
    </div>
    
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #1f2937; margin-bottom: 24px;">
        Hola <strong>${emailData.contactPerson || emailData.companyName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
        Hemos recibido correctamente su inscripción para el concurso. A continuación encontrará el resumen de las muestras registradas:
      </p>

      ${accountInfoHtml}
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 16px; font-size: 18px;">📋 Datos de la Empresa</h2>
        <p style="margin: 8px 0; color: #4b5563;"><strong>Empresa:</strong> ${emailData.companyName}</p>
        <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${emailData.companyEmail}</p>
        ${emailData.contactPerson ? `<p style="margin: 8px 0; color: #4b5563;"><strong>Persona de contacto:</strong> ${emailData.contactPerson}</p>` : ""}
        ${emailData.phone ? `<p style="margin: 8px 0; color: #4b5563;"><strong>Teléfono:</strong> ${emailData.phone}</p>` : ""}
        <p style="margin: 8px 0; color: #4b5563;"><strong>Total de muestras:</strong> ${emailData.totalSamples}</p>
      </div>
      
      <h2 style="color: #1f2937; margin-top: 24px; margin-bottom: 16px; font-size: 18px;">🍷 Muestras Registradas</h2>
      
      <table style="width: 100%; border-collapse: collapse; background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Código</th>
            <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Nombre</th>
            <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Categoría</th>
            <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">País</th>
          </tr>
        </thead>
        <tbody>
          ${samplesListHtml}
        </tbody>
      </table>
      
      <div style="margin-top: 32px; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <p style="color: #1e40af; margin: 0; font-size: 14px;">
          <strong>ℹ️ Próximos pasos:</strong><br>
          Le informaremos sobre el proceso de evaluación y los resultados en las próximas semanas.
        </p>
      </div>
      
      <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
        Si tiene alguna pregunta, no dude en contactarnos respondiendo a este email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        Este es un email automático. Por favor, no responda directamente a este mensaje.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Confirmación de Inscripción

Hola ${emailData.contactPerson || emailData.companyName},

Hemos recibido correctamente su inscripción para el concurso.

${emailData.isNewCompany && emailData.tempPassword ? `
⚠️ INFORMACIÓN IMPORTANTE DE ACCESO

Se ha creado una cuenta para acceder al área de empresas:
Email: ${emailData.companyEmail}
Contraseña temporal: ${emailData.tempPassword}

Por favor, guarde esta información de forma segura.
` : ""}

Datos de la Empresa:
- Empresa: ${emailData.companyName}
- Email: ${emailData.companyEmail}
${emailData.contactPerson ? `- Persona de contacto: ${emailData.contactPerson}\n` : ""}${emailData.phone ? `- Teléfono: ${emailData.phone}\n` : ""}- Total de muestras: ${emailData.totalSamples}

Muestras Registradas:
${emailData.samples.map((s) => `#${s.codigo} - ${s.nombre} (${s.categoria || "-"}, ${s.pais || "-"})`).join("\n")}

Próximos pasos:
Le informaremos sobre el proceso de evaluación y los resultados en las próximas semanas.

Si tiene alguna pregunta, no dude en contactarnos.
    `;

    // Intentar enviar con Resend si la API key está configurada
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@example.com';

    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [emailData.companyEmail],
            subject: 'Confirmación de Inscripción - Concurso',
            html: htmlContent,
            text: textContent,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
        }

        const resendData = await resendResponse.json();
        console.log('Email sent successfully via Resend:', resendData);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Email enviado correctamente vía Resend",
            emailId: resendData.id,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (resendError) {
        console.error('Error sending via Resend:', resendError);
        // Continuar con el modo de prueba si falla Resend
      }
    }

    // Modo de prueba: solo loguear el email
    console.log('=== EMAIL PREVIEW (Test Mode) ===');
    console.log('To:', emailData.companyEmail);
    console.log('Subject: Confirmación de Inscripción - Concurso');
    console.log('Text preview:', textContent.substring(0, 300));
    console.log('=================================');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email procesado correctamente (modo de prueba)",
        preview: {
          to: emailData.companyEmail,
          subject: "Confirmación de Inscripción - Concurso",
          textPreview: textContent.substring(0, 200),
        },
        note: resendApiKey ? "Resend configurado pero ocurrió un error" : "Configure RESEND_API_KEY para enviar emails reales",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

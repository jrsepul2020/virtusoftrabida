export default function Reglamento() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Reglamento de Participación
            </h1>
            <div className="h-1 w-24 bg-[#8A754C] mx-auto"></div>
          </div>

          {/* Content: reglamento importado desde internationalvirtus.com */}
          <div className="prose prose-lg max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: `
                  <h1>REGLAMENTO DEL CONCURSO INTERNATIONAL AWARDS “VIRTUS”</h1>
                  <p><strong>8ª EDICIÓN INTERNACIONAL, LA RÁBIDA 2026</strong></p>

                  <h2>ARTÍCULO I.- ORGANIZACIÓN</h2>
                  <p>El concurso estará organizado por EXCELENCIAS DE HUELVA, S.L. (EDHSL) Organizadora de Eventos. Las sesiones de catas se celebrarán en la ciudad de La Rábida (Huelva) los días 25, 26 y 27 de abril de 2026. El concurso está abierto a todos los vinos, espirituosos y aceites de oliva virgen extra A.O.V.E de los países productores del mundo. El concepto de vino tendrá en cuenta la definición adoptada por la O.I.V.</p>

                  <h2>ARTÍCULO II.- INSCRIPCIÓN Y ENVÍO DE MUESTRAS</h2>
                  <p>Cada participante deberá cumplimentar la correspondiente Ficha de Inscripción alojada en la WEB Oficial del Concurso, en la que se hará constar como mínimo los datos: identificación del participante; país de procedencia; categoría del producto según la normativa O.I.V.; variedades; año de cosecha cuando proceda; existencias en bodega; y envío de un mínimo de 3 botellas por marca inscrita. La admisión de muestras para el Concurso cierra el día 20 de ABRIL a las 15.00 horas. Las muestras recibidas con posterioridad perderán el derecho a participar.</p>

                  <h2>ARTÍCULO III.- DESIGNACIÓN DEL PRESIDENTE Y DIRECCIÓN TÉCNICA DEL CONCURSO</h2>
                  <p>La organización designa al Presidente, Vicepresidente y Dirección Técnica del Concurso, encargados de garantizar el cumplimiento del presente Reglamento y velar por el desarrollo de la preparación y examen organoléptico de las muestras.</p>

                  <h2>ARTÍCULO IV.- CONTROL DE LAS MUESTRAS RECIBIDAS</h2>
                  <p>La Dirección Técnica adoptará el sistema de control que estime conveniente: verificación de recepción de muestras y documentación, registro de muestras aceptadas o rechazadas, y conservación en condiciones adecuadas.</p>

                  <h2>ARTÍCULO V.- DESIGNACIÓN DE LOS COMPONENTES DEL JURADO</h2>
                  <p>La Dirección Técnica decide el número de Jurados y designa a sus miembros. Cada Jurado estará compuesto por cinco miembros expertos en análisis sensorial, con al menos tres catadores de países distintos al organizador.</p>

                  <h2>ARTÍCULO VI.- FUNCIONES ESPECÍFICAS DE LOS PRESIDENTES DEL JURADO</h2>
                  <p>El Presidente de cada Jurado garantizará el cumplimiento de las normas del Reglamento durante las sesiones de cata y podrá ordenar repeticiones de examen o proponer exclusiones cuando proceda.</p>

                  <h2>ARTÍCULO VII.- FUNCIONES DE LA SECRETARÍA TÉCNICA</h2>
                  <p>La Secretaría Técnica controlará la organización de las sesiones de cata, el orden de presentación de muestras y las condiciones ambientales, garantizando el anonimato y la integridad del proceso.</p>

                  <h2>ARTÍCULO VIII.- ORDEN DE PRESENTACIÓN DE LAS MUESTRAS EN LAS SESIONES DE CATA</h2>
                  <p>Orden general: vinos espumosos, vinos de aguja, blancos, rosados, tintos, vinos de crianza bajo velo y vinos de licor. Dentro de cada grupo, se seguirán criterios de tipo, añada y graduación alcohólica, según lo establecido por la Dirección Técnica.</p>

                  <h2>ARTÍCULO IX.- NORMAS DE FUNCIONAMIENTO DEL JURADO</h2>
                  <p>Los jurados cumplirán las normas del Reglamento y respetarán el anonimato absoluto de las muestras. Las sesiones tendrán lugar preferentemente en horario de mañana y en número que la Dirección Técnica estime conveniente.</p>

                  <h2>ARTÍCULO X.- FICHA DE CATA</h2>
                  <p>Para la evaluación se utilizará la ficha de cata de la O.I.V. y la ficha normalizada para AOVE cuando corresponda.</p>

                  <h2>ARTÍCULO XI.- TEMPERATURA DE DEGUSTACIÓN</h2>
                  <p>Temperaturas aproximadas de servicio: blancos y rosados 10-12 ºC; tintos 15-18 ºC; espumosos 8-10 ºC; aceites 15-18 ºC; espirituosos 15-18 ºC, etc.</p>

                  <h2>ARTÍCULO XII.- INTERNATIONAL AWARDS “VIRTUS”</h2>
                  <p>Las distinciones otorgadas por la Organizadora son: GREAT GOLD “VIRTUS”, GOLD “VIRTUS” y SILVER “VIRTUS”. Se estipulan límites porcentuales sobre el total de muestras inscritas y la emisión de diplomas acreditativos.</p>

                  <p>Puede descargar el reglamento oficial en PDF: <a href="https://internationalvirtus.com/wp-content/uploads/2025/12/REGLAMENTO-2026.pdf" target="_blank" rel="noopener noreferrer">REGLAMENTO-2026.pdf</a></p>

                  <div class="mt-6">
                    <h3>Contacto</h3>
                    <p>EXCELENCIAS DE HUELVA, S.L.<br/>Julio Jimenez, 24<br/>21710 Bollullos Par del Condado, Huelva<br/>CIF: B-21553193<br/>Tel: <a href="tel:+34655983717">+34 655 98 37 17</a> / <a href="tel:+34959410800">+34 959 41 08 00</a><br/>Email: <a href="mailto:info@internationalvirtus.com">info@internationalvirtus.com</a></p>
                  </div>
                `
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
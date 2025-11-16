import DeviceAuthWrapper from './components/DeviceAuthWrapper';
import CatadorDashboard from './components/CatadorDashboard';

/**
 * Aplicación específica para tablets de catadores
 * Flujo:
 * 1. Registro automático del dispositivo (primera vez)
 * 2. Login del catador
 * 3. Dashboard de cata
 */
function TabletApp() {
  return (
    <DeviceAuthWrapper>
      {(catador, tabletNumber) => (
        <CatadorDashboard 
          catador={catador}
          tabletNumber={tabletNumber}
        />
      )}
    </DeviceAuthWrapper>
  );
}

export default TabletApp;

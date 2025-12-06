-- Tabla para registrar pagos de prueba de PayPal
-- Ejecutar este SQL en Supabase para habilitar el historial de pagos de prueba

CREATE TABLE IF NOT EXISTS paypal_test_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    producto VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    paypal_order_id VARCHAR(255),
    paypal_payer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE paypal_test_payments ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones a usuarios autenticados
CREATE POLICY "Allow all for authenticated users" ON paypal_test_payments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_paypal_test_created_at ON paypal_test_payments(created_at DESC);

-- Comentario
COMMENT ON TABLE paypal_test_payments IS 'Tabla para registrar pagos de prueba de PayPal Live';

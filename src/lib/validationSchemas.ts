/**
 * Esquemas de validación con Zod
 */
import { z } from 'zod';

// ============== SCHEMAS BASE ==============

/**
 * Validación de email
 */
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Formato de email inválido');

/**
 * Validación de teléfono
 */
export const phoneSchema = z
  .string()
  .regex(/^[+]?[\d\s()-]{6,20}$/, 'Formato de teléfono inválido')
  .optional()
  .or(z.literal(''));

/**
 * Validación de NIF/CIF
 */
export const nifSchema = z
  .string()
  .regex(/^[A-Za-z0-9]{5,15}$/, 'Formato de NIF/CIF inválido')
  .optional()
  .or(z.literal(''));

/**
 * Validación de URL
 */
export const urlSchema = z
  .string()
  .url('URL inválida')
  .optional()
  .or(z.literal(''));

// ============== SCHEMAS DE FORMULARIOS ==============

/**
 * Schema para inscripción de empresa
 */
export const empresaSchema = z.object({
  nombre_empresa: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: emailSchema,
  nif: nifSchema,
  telefono: phoneSchema,
  direccion: z.string().max(200).optional().or(z.literal('')),
  localidad: z.string().max(100).optional().or(z.literal('')),
  codigo_postal: z.string().max(10).optional().or(z.literal('')),
  pais: z.string().min(1, 'Selecciona un país'),
  web: urlSchema,
  // Nota: el campo `acepta_normativa` fue eliminado intencionalmente.
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;

/**
 * Schema para muestra de vino
 */
export const muestraSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  empresa_id: z.string().uuid('ID de empresa inválido'),
  grado: z
    .number({ message: 'Debe ser un número' })
    .min(0, 'El grado debe ser positivo')
    .max(25, 'El grado no puede superar 25')
    .optional()
    .or(z.literal('')),
  azucar: z
    .number({ message: 'Debe ser un número' })
    .min(0, 'El azúcar debe ser positivo')
    .optional()
    .or(z.literal('')),
  origen: z.string().max(100).optional().or(z.literal('')),
  pais: z.string().max(50).optional().or(z.literal('')),
  variedad: z.string().max(100).optional().or(z.literal('')),
  anada: z
    .number({ message: 'Debe ser un año válido' })
    .min(1900, 'Año inválido')
    .max(new Date().getFullYear(), 'El año no puede ser futuro')
    .optional()
    .or(z.literal('')),
});

export type MuestraFormData = z.infer<typeof muestraSchema>;

/**
 * Schema para catador/usuario
 */
export const catadorSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: emailSchema,
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .optional()
    .or(z.literal('')),
  pais: z.string().optional().or(z.literal('')),
  rol: z.enum(['Administrador', 'Presidente', 'Catador']).default('Catador'),
  mesa: z.number().min(1).max(10).optional().nullable(),
  puesto: z.number().min(1).max(5).optional().nullable(),
  tablet: z.string().optional().or(z.literal('')),
  especialidad: z.string().optional().or(z.literal('')),
});

export type CatadorFormData = z.infer<typeof catadorSchema>;

/**
 * Schema para categoría de cata
 */
export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z.string().max(500).optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Formato de color inválido (#RRGGBB)')
    .optional()
    .or(z.literal('')),
  orden: z.number().min(0).optional(),
  activa: z.boolean().default(true),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;

/**
 * Schema para puntuación de cata
 */
export const cataSchema = z.object({
  muestra_id: z.string().uuid('ID de muestra inválido'),
  catador_id: z.string().uuid('ID de catador inválido'),
  tanda_id: z.string().uuid('ID de tanda inválido').optional(),
  
  // Valoraciones (0-10)
  visual: z.number().min(0).max(10, 'La puntuación máxima es 10'),
  olfativa: z.number().min(0).max(10, 'La puntuación máxima es 10'),
  gustativa: z.number().min(0).max(10, 'La puntuación máxima es 10'),
  armonia: z.number().min(0).max(10, 'La puntuación máxima es 10'),
  
  notas: z.string().max(1000).optional().or(z.literal('')),
  defectos: z.string().max(500).optional().or(z.literal('')),
});

export type CataFormData = z.infer<typeof cataSchema>;

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema para configuración
 */
export const configuracionSchema = z.object({
  clave: z.string().min(1, 'La clave es requerida'),
  valor: z.string().min(1, 'El valor es requerido'),
  descripcion: z.string().optional(),
});

export type ConfiguracionFormData = z.infer<typeof configuracionSchema>;

// ============== HELPERS DE VALIDACIÓN ==============

/**
 * Validar datos con schema
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string>; 
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
}

/**
 * Obtener errores de campo específico
 */
export function getFieldError(
  errors: Record<string, string> | undefined, 
  field: string
): string | undefined {
  return errors?.[field];
}

/**
 * Verificar si hay errores
 */
export function hasErrors(errors: Record<string, string> | undefined): boolean {
  return errors !== undefined && Object.keys(errors).length > 0;
}

// ============== SCHEMAS PARCIALES PARA EDICIÓN ==============

/**
 * Schema parcial para actualizar empresa (todos los campos opcionales excepto id)
 */
export const updateEmpresaSchema = empresaSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Schema parcial para actualizar muestra
 */
export const updateMuestraSchema = muestraSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Schema parcial para actualizar catador
 */
export const updateCatadorSchema = catadorSchema.partial().extend({
  id: z.string().uuid(),
});

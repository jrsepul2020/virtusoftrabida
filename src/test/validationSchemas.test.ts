import { describe, it, expect } from 'vitest';
import { 
  validateData, 
  empresaSchema, 
  loginSchema,
  emailSchema,
  getFieldError,
  hasErrors 
} from '../lib/validationSchemas';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('valida email correcto', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
    });

    it('rechaza email inválido', () => {
      expect(emailSchema.safeParse('invalid-email').success).toBe(false);
    });

    it('rechaza email vacío', () => {
      expect(emailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('empresaSchema', () => {
    const validEmpresa = {
      nombre_empresa: 'Bodega Test',
      email: 'info@bodega.com',
      pais: 'España',
      acepta_normativa: true,
    };

    it('valida empresa correcta', () => {
      const result = validateData(empresaSchema, validEmpresa);
      expect(result.success).toBe(true);
    });

    it('rechaza empresa sin nombre', () => {
      const result = validateData(empresaSchema, { 
        ...validEmpresa, 
        nombre_empresa: '' 
      });
      expect(result.success).toBe(false);
      expect(result.errors?.nombre_empresa).toBeDefined();
    });

    it('rechaza empresa sin aceptar normativa', () => {
      const result = validateData(empresaSchema, { 
        ...validEmpresa, 
        acepta_normativa: false 
      });
      expect(result.success).toBe(false);
      expect(result.errors?.acepta_normativa).toBeDefined();
    });

    it('valida email correcto', () => {
      const result = validateData(empresaSchema, { 
        ...validEmpresa, 
        email: 'invalido' 
      });
      expect(result.success).toBe(false);
    });

    it('permite campos opcionales vacíos', () => {
      const result = validateData(empresaSchema, {
        ...validEmpresa,
        nif: '',
        telefono: '',
        web: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('valida login correcto', () => {
      const result = validateData(loginSchema, {
        email: 'admin@test.com',
        password: 'secreto123',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza password vacío', () => {
      const result = validateData(loginSchema, {
        email: 'admin@test.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Helper functions', () => {
    it('getFieldError devuelve error específico', () => {
      const errors = { email: 'Email inválido', nombre: 'Requerido' };
      expect(getFieldError(errors, 'email')).toBe('Email inválido');
      expect(getFieldError(errors, 'otro')).toBeUndefined();
    });

    it('hasErrors detecta errores', () => {
      expect(hasErrors({ campo: 'error' })).toBe(true);
      expect(hasErrors({})).toBe(false);
      expect(hasErrors(undefined)).toBe(false);
    });
  });
});

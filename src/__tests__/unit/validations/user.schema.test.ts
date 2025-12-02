/**
 * User Schema Validation Tests
 *
 * Tests for user profile validation including:
 * - Full name validation (min 3 chars)
 * - Phone number format validation
 * - Email format validation
 */

import { describe, it, expect } from 'vitest';
import {
  profileUpdateSchema,
  emailUpdateSchema,
} from '../../../lib/validations/user.schema';

describe('User Schema Validation', () => {
  describe('profileUpdateSchema - Valid Cases', () => {
    it('should accept valid profile data with all fields', () => {
      const validData = {
        full_name: 'John Doe',
        phone: '08123456789',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept full_name with minimum 3 characters', () => {
      const data = {
        full_name: 'ABC',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept long full names', () => {
      const data = {
        full_name: 'Dr. Muhammad Abdullah bin Ahmad Al-Khwarizmi',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept profile without phone', () => {
      const data = {
        full_name: 'John Doe',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty phone when omitted', () => {
      const data = {
        full_name: 'John Doe',
        phone: undefined,
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept Indonesian phone format (08xxx)', () => {
      const data = {
        full_name: 'John Doe',
        phone: '08123456789',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept international phone format (+62)', () => {
      const data = {
        full_name: 'John Doe',
        phone: '+6281234567890',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept phone with spaces', () => {
      const data = {
        full_name: 'John Doe',
        phone: '+62 812 3456 7890',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept phone with dashes', () => {
      const data = {
        full_name: 'John Doe',
        phone: '0812-3456-7890',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept phone with parentheses', () => {
      const data = {
        full_name: 'John Doe',
        phone: '(021) 1234-5678',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept phone with mixed format', () => {
      const data = {
        full_name: 'John Doe',
        phone: '+62 (21) 1234-5678',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept full_name with special characters', () => {
      const data = {
        full_name: "O'Brien-Smith Jr.",
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept full_name with unicode characters', () => {
      const data = {
        full_name: 'José García',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept full_name with Indonesian characters', () => {
      const data = {
        full_name: 'Siti Nurhaliza',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('profileUpdateSchema - Invalid Cases', () => {
    it('should reject empty full_name', () => {
      const data = {
        full_name: '',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject full_name with less than 3 characters', () => {
      const data = {
        full_name: 'AB',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject full_name with exactly 2 characters', () => {
      const data = {
        full_name: 'Jo',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject full_name with only 1 character', () => {
      const data = {
        full_name: 'J',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing full_name field', () => {
      const data = {
        phone: '08123456789',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject phone with letters', () => {
      const data = {
        full_name: 'John Doe',
        phone: '0812ABC456',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid phone number format');
      }
    });

    it('should reject phone with special characters (except allowed)', () => {
      const data = {
        full_name: 'John Doe',
        phone: '0812@3456#789',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject phone with dots', () => {
      const data = {
        full_name: 'John Doe',
        phone: '0812.3456.789',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject phone with slashes', () => {
      const data = {
        full_name: 'John Doe',
        phone: '0812/3456/789',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('emailUpdateSchema - Valid Cases', () => {
    it('should accept valid email address', () => {
      const data = {
        email: 'user@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const data = {
        email: 'user@mail.example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept email with plus sign', () => {
      const data = {
        email: 'user+test@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      const data = {
        email: 'first.last@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept email with numbers', () => {
      const data = {
        email: 'user123@example456.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept email with hyphens in domain', () => {
      const data = {
        email: 'user@my-company.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept email with long TLD', () => {
      const data = {
        email: 'user@example.university',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept Indonesian academic email', () => {
      const data = {
        email: 'mahasiswa@student.ac.id',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('emailUpdateSchema - Invalid Cases', () => {
    it('should reject empty email', () => {
      const data = {
        email: '',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject missing email field', () => {
      const data = {};

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email without @ symbol', () => {
      const data = {
        email: 'userexample.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject email without domain', () => {
      const data = {
        email: 'user@',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email without local part', () => {
      const data = {
        email: '@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email without TLD', () => {
      const data = {
        email: 'user@example',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email with spaces', () => {
      const data = {
        email: 'user name@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email with multiple @ symbols', () => {
      const data = {
        email: 'user@@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email with invalid characters', () => {
      const data = {
        email: 'user#name@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject plain text instead of email', () => {
      const data = {
        email: 'not an email',
      };

      const result = emailUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should accept full_name with surrounding whitespace', () => {
      const data = {
        full_name: '  John Doe  ',
      };

      const result = profileUpdateSchema.safeParse(data);
      // Schema doesn't have trim(), so spaces are preserved
      expect(result.success).toBe(true);
    });

    it('should reject null phone (phone is optional string, not nullable)', () => {
      const data = {
        full_name: 'John Doe',
        phone: null as any,
      };

      const result = profileUpdateSchema.safeParse(data);
      // Schema has optional() but not nullable(), so null fails
      // The refine() only runs if value exists
      expect(result.success).toBe(false);
    });

    it('should accept empty string for optional phone', () => {
      const data = {
        full_name: 'John Doe',
        phone: '',
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle very long full_name', () => {
      const data = {
        full_name: 'A'.repeat(200),
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept full_name with only spaces (no trim in schema)', () => {
      const data = {
        full_name: '   ',
      };

      const result = profileUpdateSchema.safeParse(data);
      // Schema doesn't trim, so 3 spaces = 3 characters = valid
      expect(result.success).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should validate profileUpdateSchema type inference', () => {
      const data = {
        full_name: 'John Doe',
        phone: '08123456789',
      };

      const result = profileUpdateSchema.safeParse(data);

      if (result.success) {
        // Type should have full_name and optional phone
        expect(result.data).toHaveProperty('full_name');
        expect(typeof result.data.full_name).toBe('string');
      }
    });

    it('should validate emailUpdateSchema type inference', () => {
      const data = {
        email: 'user@example.com',
      };

      const result = emailUpdateSchema.safeParse(data);

      if (result.success) {
        // Type should have email
        expect(result.data).toHaveProperty('email');
        expect(typeof result.data.email).toBe('string');
      }
    });
  });
});

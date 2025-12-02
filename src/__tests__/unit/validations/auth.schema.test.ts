/**
 * Auth Validation Schema Unit Tests
 * Comprehensive tests for authentication form validation
 */

import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  passwordResetSchema,
  passwordUpdateSchema,
} from '@/lib/validations/auth.schema';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    describe('valid data', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'user@example.com',
          password: 'password123',
        };

        const result = loginSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it('should accept password with exact minimum length', () => {
        const validData = {
          email: 'user@example.com',
          password: '123456', // Exactly 6 characters
        };

        const result = loginSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid email', () => {
      it('should reject empty email', () => {
        const invalidData = {
          email: '',
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject invalid email format', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid email');
        }
      });

      it('should reject email without domain', () => {
        const invalidData = {
          email: 'user@',
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid password', () => {
      it('should reject empty password', () => {
        const invalidData = {
          email: 'user@example.com',
          password: '',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject password shorter than 6 characters', () => {
        const invalidData = {
          email: 'user@example.com',
          password: '12345',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 6');
        }
      });
    });
  });

  describe('registerSchema - Mahasiswa', () => {
    describe('valid data', () => {
      it('should validate correct mahasiswa registration', () => {
        const validData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          phone: '081234567890',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept optional phone number', () => {
        const validData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid NIM', () => {
      it('should reject NIM with wrong format', () => {
        const invalidData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: '123456789', // Wrong format
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('format');
        }
      });

      it('should reject NIM with incorrect length', () => {
        const invalidData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: 'BD23210', // Too short
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('format');
        }
      });

      it('should reject NIM without letters', () => {
        const invalidData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: '232100100', // No letters
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid semester', () => {
      it('should reject semester below 1', () => {
        const invalidData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 0,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject semester above 14', () => {
        const invalidData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 15,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid angkatan', () => {
      it('should reject angkatan before 2020', () => {
        const invalidData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2019,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject angkatan far in future', () => {
        const nextYear = new Date().getFullYear() + 2;
        const invalidData = {
          email: 'mahasiswa@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: nextYear,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('registerSchema - Dosen', () => {
    describe('valid data', () => {
      it('should validate correct dosen registration', () => {
        const validData = {
          email: 'dosen@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Dr. Jane Smith',
          role: 'dosen' as const,
          nidn: '1234567890',
          nuptk: '1234567890123456',
          gelar_depan: 'Dr.',
          gelar_belakang: 'M.Kom',
        };

        const result = registerSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept dosen without optional fields', () => {
        const validData = {
          email: 'dosen@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Jane Smith',
          role: 'dosen' as const,
          nidn: '1234567890',
        };

        const result = registerSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid NIDN', () => {
      it('should reject NIDN with wrong length', () => {
        const invalidData = {
          email: 'dosen@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Jane Smith',
          role: 'dosen' as const,
          nidn: '123456', // Too short
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('10 digits');
        }
      });

      it('should reject NIDN with non-numeric characters', () => {
        const invalidData = {
          email: 'dosen@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Jane Smith',
          role: 'dosen' as const,
          nidn: '12345ABC90',
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid NUPTK', () => {
      it('should reject NUPTK with wrong length', () => {
        const invalidData = {
          email: 'dosen@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Jane Smith',
          role: 'dosen' as const,
          nidn: '1234567890',
          nuptk: '123456', // Too short
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('16 digits');
        }
      });
    });
  });

  describe('registerSchema - Laboran', () => {
    describe('valid data', () => {
      it('should validate correct laboran registration', () => {
        const validData = {
          email: 'laboran@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Bob Johnson',
          role: 'laboran' as const,
          nip: '1234567890',
        };

        const result = registerSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept 18-digit NIP', () => {
        const validData = {
          email: 'laboran@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Bob Johnson',
          role: 'laboran' as const,
          nip: '123456789012345678',
        };

        const result = registerSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid NIP', () => {
      it('should reject NIP with wrong length', () => {
        const invalidData = {
          email: 'laboran@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Bob Johnson',
          role: 'laboran' as const,
          nip: '123', // Too short
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('10-18 digits');
        }
      });

      it('should reject NIP with non-numeric characters', () => {
        const invalidData = {
          email: 'laboran@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Bob Johnson',
          role: 'laboran' as const,
          nip: '12345ABCDE',
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('registerSchema - Common Validations', () => {
    describe('password confirmation', () => {
      it('should reject when passwords don\'t match', () => {
        const invalidData = {
          email: 'user@example.com',
          password: 'password123',
          confirmPassword: 'different',
          full_name: 'John Doe',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('don\'t match');
        }
      });
    });

    describe('full name validation', () => {
      it('should reject full name shorter than 3 characters', () => {
        const invalidData = {
          email: 'user@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'Jo',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3');
        }
      });

      it('should reject empty full name', () => {
        const invalidData = {
          email: 'user@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: '',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe('phone validation', () => {
      it('should accept valid phone formats', () => {
        const validPhones = [
          '081234567890',
          '+628123456789',
          '(021) 12345678',
          '021-12345678',
        ];

        validPhones.forEach((phone) => {
          const validData = {
            email: 'user@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            full_name: 'John Doe',
            phone,
            role: 'mahasiswa' as const,
            nim: 'BD2321001',
            program_studi: 'Informatika',
            angkatan: 2023,
            semester: 5,
          };

          const result = registerSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid phone format', () => {
        const invalidData = {
          email: 'user@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          phone: 'invalid-phone',
          role: 'mahasiswa' as const,
          nim: 'BD2321001',
          program_studi: 'Informatika',
          angkatan: 2023,
          semester: 5,
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid phone');
        }
      });
    });

    describe('role validation', () => {
      it('should reject invalid role', () => {
        const invalidData = {
          email: 'user@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          full_name: 'John Doe',
          role: 'admin' as any, // Invalid role
        };

        const result = registerSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('passwordResetSchema', () => {
    it('should validate correct email', () => {
      const validData = {
        email: 'user@example.com',
      };

      const result = passwordResetSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
      };

      const result = passwordResetSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
      };

      const result = passwordResetSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('passwordUpdateSchema', () => {
    it('should validate matching passwords', () => {
      const validData = {
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const result = passwordUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject when passwords don\'t match', () => {
      const invalidData = {
        password: 'password123',
        confirmPassword: 'different',
      };

      const result = passwordUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('don\'t match');
      }
    });

    it('should reject password shorter than 6 characters', () => {
      const invalidData = {
        password: '12345',
        confirmPassword: '12345',
      };

      const result = passwordUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        password: '',
        confirmPassword: '',
      };

      const result = passwordUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});

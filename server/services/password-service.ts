import bcrypt from 'bcrypt';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a plaintext password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a plaintext password against a hashed password using bcrypt
   */
  static async verifyPassword(plaintext: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plaintext, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Hash a backup code using bcrypt
   */
  static async hashBackupCode(code: string): Promise<string> {
    // Use lower salt rounds for backup codes since they need to be compared frequently
    return bcrypt.hash(code, 10);
  }

  /**
   * Verify a backup code against a hashed backup code using bcrypt
   */
  static async verifyBackupCode(plaintext: string, hashedCode: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plaintext, hashedCode);
    } catch (error) {
      console.error('Backup code verification error:', error);
      return false;
    }
  }
}
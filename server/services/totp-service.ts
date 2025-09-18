import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { PasswordService } from './password-service';

export class TOTPService {
  private readonly serviceName = 'TradeAI';
  
  /**
   * Generate a new TOTP secret
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }
  
  /**
   * Generate backup codes for 2FA recovery
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
  
  /**
   * Generate QR code data URL for TOTP setup
   */
  async generateQRCode(userEmail: string, secret: string): Promise<string> {
    const otpUrl = authenticator.keyuri(userEmail, this.serviceName, secret);
    return await QRCode.toDataURL(otpUrl);
  }
  
  /**
   * Verify a TOTP token
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }
  
  /**
   * Verify a backup code (removes it from the array if valid)
   * Now handles hashed backup codes using bcrypt comparison
   */
  async verifyBackupCode(code: string, hashedBackupCodes: string[]): Promise<{ isValid: boolean; remainingCodes: string[] }> {
    const normalizedCode = code.toUpperCase();
    
    // Find the matching hashed backup code
    let matchedIndex = -1;
    for (let i = 0; i < hashedBackupCodes.length; i++) {
      const isMatch = await PasswordService.verifyBackupCode(normalizedCode, hashedBackupCodes[i]);
      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }
    
    if (matchedIndex === -1) {
      return { isValid: false, remainingCodes: hashedBackupCodes };
    }
    
    // Remove the used backup code
    const remainingCodes = [...hashedBackupCodes];
    remainingCodes.splice(matchedIndex, 1);
    
    return { isValid: true, remainingCodes };
  }
  
  /**
   * Check if backup codes are running low
   */
  shouldRegenerateBackupCodes(backupCodes: string[]): boolean {
    return backupCodes.length <= 2;
  }
}

// Create singleton instance
export const totpService = new TOTPService();
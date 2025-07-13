export interface EmailService {
  sendResetEmail(email: string, fullName: string, token: string): Promise<void>;
  sendEmailVerification(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void>;
  sendResetPassword(email: string, token: string): Promise<void>;
}

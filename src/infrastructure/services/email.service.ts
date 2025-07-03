export interface EmailService {
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendEmailVerification(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void>;
}

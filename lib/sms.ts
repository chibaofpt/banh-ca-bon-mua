/**
 * ESMS stub for OTP notifications.
 * Console log in development or if ESMS_SANDBOX=1.
 */
export const sendOtpSms = async (phone: string, code: string) => {
  const isSandbox = process.env.ESMS_SANDBOX !== '0';

  if (isSandbox) {
    console.log(`[ESMS SANDBOX] Gửi mã OTP ${code} đến số ${phone}`);
    return { success: true, message: 'Mã OTP đã được gửi (Sandbox)' };
  }

  // Phase 5: Real ESMS integration goes here
  console.log(`[ESMS PROD STUB] Gửi mã OTP ${code} đến số ${phone}`);
  return { success: true, message: 'Mã OTP đã được gửi' };
};

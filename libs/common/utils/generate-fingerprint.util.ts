import * as crypto from 'crypto';

export const generateFingerprint = (ipAddress: string, userAgent: string) => {
  const data = `${ipAddress}-${userAgent}`;

  return crypto.createHash('sha256').update(data).digest('hex');
};

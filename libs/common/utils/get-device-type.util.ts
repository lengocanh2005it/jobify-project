import { UAParser } from 'ua-parser-js';

export const getDeviceType = (userAgent: string) => {
  const parser = new UAParser(userAgent);

  const device = parser.getDevice();

  return device.type || 'desktop';
};

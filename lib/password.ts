import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');

  if (derived.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(derived, stored);
}

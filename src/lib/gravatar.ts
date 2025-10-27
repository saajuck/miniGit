import crypto from 'crypto';

/**
 * Generate Gravatar URL from email
 */
export function getGravatarUrl(email: string, size: number = 40): string {
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}


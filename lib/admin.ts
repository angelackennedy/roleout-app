export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const allowlist = adminEmails.split(',').map(e => e.trim().toLowerCase());
  
  return allowlist.includes(email.toLowerCase());
}

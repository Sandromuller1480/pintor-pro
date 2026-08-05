export type PainterApplicationLookupRecord = {
  id?: string;
  email?: string | null;
  status?: string | null;
  auth_user_id?: string | null;
};

export const pickBestPainterApplication = <T extends PainterApplicationLookupRecord>(
  applications: T[],
  email: string,
  userId?: string
) => {
  if (!applications.length) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const byUserId = userId
    ? applications.filter((application) => application.auth_user_id === userId)
    : [];
  const byEmail = applications.filter((application) => (
    typeof application.email === 'string' && application.email.trim().toLowerCase() === normalizedEmail
  ));

  const pickAccepted = (items: T[]) => items.find((application) => application.status === 'accepted') ?? null;

  return pickAccepted(byUserId)
    ?? byUserId[0]
    ?? pickAccepted(byEmail)
    ?? byEmail[0]
    ?? applications[0]
    ?? null;
};

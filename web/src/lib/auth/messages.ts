export function authMessage(error: string | undefined): string {
  const text = (error ?? "").toLowerCase();
  if (!text) return "The request could not be completed.";
  if (text.includes("invalid login") || text.includes("invalid credentials")) {
    return "The credentials were rejected.";
  }
  if (text.includes("already registered") || text.includes("already exists")) {
    return "An account with this address already exists.";
  }
  if (text.includes("email not confirmed") || text.includes("not confirmed")) {
    return "Confirm the account from the message sent to this address.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Wait, then retry.";
  }
  if (text.includes("password")) {
    return "The password does not meet the requirement.";
  }
  return "The credentials were rejected.";
}

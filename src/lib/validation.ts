export function passwordIssues(p: string): string[] {
  const issues: string[] = [];
  if (p.length < 8) issues.push("at least 8 characters");
  if (!/[A-Z]/.test(p)) issues.push("an uppercase letter");
  if (!/[a-z]/.test(p)) issues.push("a lowercase letter");
  if (!/[0-9]/.test(p)) issues.push("a number");
  return issues;
}

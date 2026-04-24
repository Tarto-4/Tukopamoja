export function getBasePath(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return "";

  try {
    const parsed = new URL(appUrl);
    const normalizedPath = parsed.pathname.replace(/\/$/, "");
    return normalizedPath && normalizedPath !== "/" ? normalizedPath : "";
  } catch {
    return "";
  }
}

export function withBasePath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBasePath()}${normalizedPath}`;
}

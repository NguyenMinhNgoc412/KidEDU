const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function accountMediaDirectory(root: string, accountId: string) {
  if (!uuid.test(accountId)) throw new Error("INVALID_MEDIA_NAMESPACE");
  return `${root.replace(/\/*$/, "/")}media/accounts/${accountId.toLowerCase()}/`;
}
export function mediaUriAllowedForAccount(uri: string | null, accountId: string | null) {
  if (!uri) return true;
  let owner: string | undefined;
  try {
    if (uri.startsWith("web-media://")) owner = uri.slice("web-media://".length).split("/")[0];
    else if (uri.startsWith("file://"))
      owner = new URL(uri).pathname.match(/\/media\/accounts\/([^/]+)\//)?.[1];
  } catch {
    return false;
  }
  if (!owner || (!uuid.test(owner) && !uri.includes("/media/accounts/"))) return true; // Unassigned legacy data is not silently migrated.
  return Boolean(accountId && uuid.test(owner) && owner.toLowerCase() === accountId.toLowerCase());
}

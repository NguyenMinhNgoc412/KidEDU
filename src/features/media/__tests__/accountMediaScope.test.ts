import { accountMediaDirectory, mediaUriAllowedForAccount } from "../accountMediaScope";
const first = "10000000-0000-4000-8000-000000000010";
const second = "20000000-0000-4000-8000-000000000010";
test("durable media paths isolate internal account IDs and reject traversal", () => {
  expect(accountMediaDirectory("file:///documents/", first)).toBe(
    `file:///documents/media/accounts/${first}/`
  );
  expect(() => accountMediaDirectory("file:///documents/", "../other")).toThrow(
    "INVALID_MEDIA_NAMESPACE"
  );
  expect(accountMediaDirectory("file:///documents/", first)).not.toBe(
    accountMediaDirectory("file:///documents/", second)
  );
});
test("resolver denies foreign account files/blobs even with cached URI", () => {
  const uri = `file:///documents/media/accounts/${first}/audio/clip.m4a`;
  expect(mediaUriAllowedForAccount(uri, first)).toBe(true);
  expect(mediaUriAllowedForAccount(uri, second)).toBe(false);
  expect(mediaUriAllowedForAccount(uri, null)).toBe(false);
  expect(mediaUriAllowedForAccount(`web-media://${first}/clip`, second)).toBe(false);
  expect(mediaUriAllowedForAccount(`web-media://${first}/clip`, first)).toBe(true);
  expect(
    mediaUriAllowedForAccount(
      `file:///documents/media/accounts/${first}/../${second}/audio/clip.m4a`,
      first
    )
  ).toBe(false);
});
test("bundled/default assets and unassigned legacy data are not silently reassigned", () => {
  expect(mediaUriAllowedForAccount("bundled-default://audio/test", first)).toBe(true);
  expect(mediaUriAllowedForAccount("file:///documents/media/audio/custom/legacy.m4a", first)).toBe(
    true
  );
});

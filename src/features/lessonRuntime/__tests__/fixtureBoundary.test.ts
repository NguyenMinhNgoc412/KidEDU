import { permitsLocalFixture } from "../fixtureBoundary";

test("LAN lessons require explicit development opt-in and reject remote identities", () => {
  for (const host of ["192.168.88.185", "10.1.2.3", "172.16.0.2", "172.31.255.254"]) {
    expect(permitsLocalFixture(true, `http://${host}:3000`)).toBe(false);
    expect(permitsLocalFixture(true, `http://${host}:3000`, undefined, true)).toBe(true);
    expect(permitsLocalFixture(false, `http://${host}:3000`, undefined, true)).toBe(false);
    expect(permitsLocalFixture(true, `http://${host}:3000`, "https://identity.example", true)).toBe(
      false
    );
  }
  for (const url of [
    "https://192.168.1.2",
    "http://8.8.8.8",
    "http://172.32.0.1",
    "http://example.com",
    "invalid"
  ]) {
    expect(permitsLocalFixture(true, url, undefined, true)).toBe(false);
  }
  expect(permitsLocalFixture(true, "http://localhost:3000")).toBe(true);
});

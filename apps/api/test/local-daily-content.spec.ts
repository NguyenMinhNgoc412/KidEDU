import { LocalDailyContentGateway } from "../src/daily-games/local-daily-content.gateway";

const old = {
  APP_ENV: process.env.APP_ENV,
  C50_LOCAL_DAILY_FIXTURE: process.env.C50_LOCAL_DAILY_FIXTURE
};
afterEach(() => {
  for (const [key, value] of Object.entries(old)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
it.each(["production", "staging", undefined])(
  "rejects the fixture in %s even with the flag",
  (environment) => {
    if (environment === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = environment;
    process.env.C50_LOCAL_DAILY_FIXTURE = "1";
    expect(() => new LocalDailyContentGateway()).toThrow("not permitted");
  }
);
it("requires explicit opt-in locally and produces the exact basic/full quotas", () => {
  process.env.APP_ENV = "local";
  delete process.env.C50_LOCAL_DAILY_FIXTURE;
  expect(() => new LocalDailyContentGateway()).toThrow("not permitted");
  process.env.C50_LOCAL_DAILY_FIXTURE = "1";
  const content = new LocalDailyContentGateway();
  expect(content.plan("basic").shadowScreens).toHaveLength(2);
  expect(content.plan("basic").listenRounds).toHaveLength(5);
  expect(content.plan("full").shadowScreens).toHaveLength(5);
  expect(content.plan("full").listenRounds).toHaveLength(12);
  expect(content.plan("full").memoryTargetIds).toHaveLength(5);
  expect(content.rewards().items.every((item) => item.id.startsWith("local_"))).toBe(true);
});

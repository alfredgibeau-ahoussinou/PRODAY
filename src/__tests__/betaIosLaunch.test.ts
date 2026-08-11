import {
  getIosBetaLaunchDate,
  isIosBetaLaunched,
  isTestFlightAvailable,
  IOS_BETA_DELAY_NOTICE,
  IOS_BETA_LAUNCH_LABEL,
} from "../../website/src/lib/betaIosLaunch";

describe("betaIosLaunch", () => {
  it("launch date is 15 Aug 2026 18:00 Paris (CEST)", () => {
    expect(getIosBetaLaunchDate().toISOString()).toBe("2026-08-15T16:00:00.000Z");
    expect(IOS_BETA_LAUNCH_LABEL).toBe("15 août 2026 à 18 h");
  });

  it("exposes delay notice for the postponed beta", () => {
    expect(IOS_BETA_DELAY_NOTICE).toMatch(/15 août 2026/);
    expect(IOS_BETA_DELAY_NOTICE).toMatch(/améliorations nécessaires/);
  });

  it("is not launched before launch datetime", () => {
    expect(isIosBetaLaunched(new Date("2026-08-15T15:59:59.000Z"))).toBe(false);
    expect(isIosBetaLaunched(new Date("2026-08-15T16:00:00.000Z"))).toBe(true);
  });

  it("TestFlight requires launch date and URL", () => {
    const prev = process.env.NEXT_PUBLIC_BETA_TESTFLIGHT_URL;
    process.env.NEXT_PUBLIC_BETA_TESTFLIGHT_URL = "https://testflight.apple.com/join/test";
    expect(isTestFlightAvailable(new Date("2026-08-14T12:00:00.000Z"))).toBe(false);
    expect(isTestFlightAvailable(new Date("2026-08-15T17:00:00.000Z"))).toBe(true);
    process.env.NEXT_PUBLIC_BETA_TESTFLIGHT_URL = prev;
  });
});

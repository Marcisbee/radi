import { GLOBALS } from "../GLOBALS";

describe("GLOBALS.js", () => {
  it("exports constants", () => {
    expect(GLOBALS.IDS).toBeDefined();
    expect(GLOBALS.REGISTERED).toBeDefined();
    expect(GLOBALS.MIX).toBeDefined();
    expect(GLOBALS.FROZEN_STATE).toBeDefined();
    expect(GLOBALS.RL).toBeDefined();
    expect(GLOBALS.RR).toBeDefined();
    expect(GLOBALS.IDS).toBeDefined();
    expect(GLOBALS.VERSION).toBeDefined();
    expect(GLOBALS.ACTIVE_COMPONENTS).toBeDefined();
    expect(GLOBALS.HTML_CACHE).toBeDefined();
    expect(GLOBALS.R_KEYS).toBeDefined();
  });
});

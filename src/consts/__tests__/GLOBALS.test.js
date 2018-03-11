import GLOBALS from "../GLOBALS";

describe("GLOBALS.js", () => {
  it("exports constants", () => {
    expect(GLOBALS.MIX).toBeDefined();
    expect(GLOBALS.FROZEN_STATE).toBeDefined();
    expect(GLOBALS.VERSION).toBeDefined();
    expect(GLOBALS.ACTIVE_COMPONENTS).toBeDefined();
    expect(GLOBALS.HTML_CACHE).toBeDefined();
  });
});

import { COMMENTS, FIND_L } from "../REGEX";

describe("REGEX.js", () => {
  it("exports regular expressions", () => {
    expect(COMMENTS).toBeInstanceOf(RegExp);
    expect(FIND_L).toBeInstanceOf(RegExp);
  });
});

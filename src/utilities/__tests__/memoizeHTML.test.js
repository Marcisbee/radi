import { GLOBALS } from "../../consts/GLOBALS";
import { memoizeHTML } from "../memoizeHTML";

afterEach(() => {
  GLOBALS.HTML_CACHE = {};
});

describe("memoizeHTML.js", () => {
  it("returns the requested element from cache", () => {
    GLOBALS.HTML_CACHE.div = { foo: "bar" };
    expect(memoizeHTML("div")).toEqual({ foo: "bar" });
  });

  it("adds the given element to cache if it's not there yet", () => {
    expect(typeof memoizeHTML("span")).toBe("object");
    expect(typeof GLOBALS.HTML_CACHE.span).toBe("object");
  });
});

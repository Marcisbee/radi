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

  it("adds the requested element to cache if it's not there yet", () => {
    expect(memoizeHTML("span")).toBeInstanceOf(HTMLSpanElement);
    expect(GLOBALS.HTML_CACHE.span).toBeInstanceOf(HTMLSpanElement);
  });
});

import { arrayMods } from '../arrayMods';

describe("arrayMods.js", () => {
  it("binds the given function to the given array's methods", () => {
    const arr = [1, 2, 3];
    const s = () => "foobar";
    arrayMods(arr, s);
    expect(arr.__radi).toBe(true);
    expect(arr.reverse()).toBe("foobar");
    expect(arr.push()).toBe("foobar");
    expect(arr.splice()).toBe("foobar");
    expect(arr.pop()).toBe("foobar");
    expect(arr.shift()).toBe("foobar");
  });

  it("returns false when the first parameters is not an array", () => {
    expect(arrayMods({ foo: "bar" }, () => {})).toBe(false);
  });

  it("returns false when the first parameter is already modified", () => {
    const arr = [1, 2, 3];
    arr.__radi = true;
    expect(arrayMods(arr, () => {})).toBe(false);
  });
});

import { atom } from "recoil";

const findSquareState = atom<number[][]>({
  key: "findSquareState",
  default: [],
});

export { findSquareState };

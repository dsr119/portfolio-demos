// Demo stand-in for the league app's database module: no network, no sign-in.
// Saving reports that the demo keeps changes in this tab only.
export function sameWorkspace(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
export const cloud = {
  get verification() { return null; },
  get email() { return null; },
  async login() { throw Error("Signing in is turned off in the demo."); },
  async logout() {},
  async load() { return null; },
  async save() { throw Error("Saving is turned off in the demo. Changes stay in this tab until you refresh."); },
};

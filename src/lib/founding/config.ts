import { parseFoundingProgramStart } from "./core";

export function readFoundingProgramConfig() {
  return parseFoundingProgramStart(process.env.FOUNDING_PROGRAM_START_AT);
}

import type { Factories, SetBuild } from "./common";
import * as street from "./street";
import * as kitchen from "./kitchen";
import * as clinic from "./clinic";
import * as clerkOffice from "./clerkOffice";
import * as dock from "./dock";
import * as bedroom from "./bedroom";
import * as schoolyard from "./schoolyard";
import * as townSquare from "./townSquare";

export const SETS: Record<string, { build: (f: Factories) => SetBuild }> = { street, kitchen, clinic, clerkOffice, dock, bedroom, schoolyard, townSquare };
export const SET_IDS = Object.keys(SETS);

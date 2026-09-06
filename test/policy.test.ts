import { expect, it } from "vitest"
import { createPolicy } from "../src/policy.js"

it("combines overlapping rules in stable order", () => expect(createPolicy({ require: [{ skill: "z", path: "src/**/*.ts" }, { skill: "a", path: "src/*.ts" }] }).forPaths(["src/x.ts"], "/repo")).toEqual({ path: "src/x.ts", rules: ["src/**/*.ts", "src/*.ts"].sort(), skills: ["a", "z"] }))

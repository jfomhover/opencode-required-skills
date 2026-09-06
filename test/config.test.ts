import { describe, expect, it } from "vitest"
import { ConfigurationError, parseOptions } from "../src/config.js"

describe("configuration", () => {
  it("validates and deduplicates policies", () => expect(parseOptions({ require: [{ skill: "a", on: { path: "./src/**/*.ts" } }, { skill: "a", on: { path: "./src/**/*.ts" } }] })).toEqual({ require: [{ skill: "a", path: "./src/**/*.ts" }] }))
  it("rejects unknown options and conditions", () => {
    expect(() => parseOptions({ nope: true })).toThrow(ConfigurationError)
    expect(() => parseOptions({ require: [{ skill: "a", on: { path: "x", content: "y" } }] })).toThrow(ConfigurationError)
  })
  it("rejects empty values", () => expect(() => parseOptions({ require: [{ skill: " ", on: { path: "x" } }] })).toThrow(ConfigurationError))
})

import requiredSkills from "../../../dist/index.js"

export default async (input) => {
  const hooks = await requiredSkills(input, {
    require: [
      {
        skill: "smoke-test-skill",
        on: { path: "smoke-test/protected/**/*.md" },
      },
    ],
  })
  return hooks
}

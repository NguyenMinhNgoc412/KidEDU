module.exports = {
  ...require("./jest.config"),
  preset: "jest-expo/ios",
  testMatch: ["**/__tests__/**/*.native.test.ts", "**/__tests__/**/*.native.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/"]
};

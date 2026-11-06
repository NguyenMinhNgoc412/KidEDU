module.exports = {
  preset: "jest-expo/node",
  modulePathIgnorePatterns: ["<rootDir>/apps/api"],
  testPathIgnorePatterns: ["/node_modules/", "\\.native\\.test\\.tsx?$"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(\\.pnpm|react-native|@react-native|expo|@expo|@react-navigation|@shopify/flash-list|lucide-react-native))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/"
  ]
};

module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/middlewares/**',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  verbose: true,
  testTimeout: 10000,
  reporters: [
    "default",
    ["jest-html-reporters", {
      publicPath: "./reports",
      filename: "report.html",
      expand: true
    }]
  ]
};

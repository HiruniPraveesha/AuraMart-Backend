export default {
  transform: {
    '^.+\\.js$': 'babel-jest', // Use babel-jest for JS transformation (only if using Babel)
  },
  testEnvironment: 'node', // Test environment as Node.js
  moduleFileExtensions: ['js', 'json', 'node'], // Only include .js, .json, .node
};

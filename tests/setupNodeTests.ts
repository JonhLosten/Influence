// tests/setupNodeTests.ts
import "dotenv/config"; // Load environment variables for tests
// Add any global mocks or setup for Node.js based tests here
// For example, if you mock `fetch` or other Node.js globals for tests

// Example: Mock for electron-log if tests run outside Electron environment
// global.require = jest.fn(); // If needed for specific electron-log internal logic
// jest.mock('electron-log', () => ({
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
//   debug: jest.fn(),
//   transports: { file: {}, console: {} },
// }));

// Example: Mock for keytar if needed for tests
// jest.mock('keytar', () => ({
//   setPassword: jest.fn(),
//   getPassword: jest.fn(),
//   deletePassword: jest.fn(),
// }));

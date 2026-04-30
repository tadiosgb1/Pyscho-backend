/**
 * Bug Condition Exploration Test — MySQL errno 1932
 *
 * Property 1: Bug Condition — InnoDB Tablespace Missing (errno 1932)
 *
 * This test encodes the bug condition: when `db.sequelize.sync({ alter: true })`
 * throws a SequelizeDatabaseError with errno 1932 (Table doesn't exist in engine),
 * the CURRENT (unfixed) server.js:
 *   - Does NOT call app.listen() — the server never starts
 *   - Does NOT log an actionable repair message — only logs the raw error
 *   - Does NOT call process.exit(1) — no explicit failure signaling
 *
 * This test documents the CURRENT broken behavior. After the fix (Task 3.2),
 * the behavior will change: an actionable FATAL message will be logged and
 * process.exit(1) will be called.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

'use strict';

// ─── Shared mock state (must be prefixed with 'mock' for jest.mock hoisting) ─

// Sync mock — controlled per-test via mockSyncImpl
let mockSyncImpl = jest.fn();

// Express app mock
let mockListenFn = jest.fn();

// Route mock shared across all route modules
const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
};

// ─── Module mocks (hoisted by Jest, must only reference mock-prefixed vars) ──

jest.mock('../models', () => ({
  sequelize: {
    sync: (...args) => mockSyncImpl(...args),
  },
}));

jest.mock('express', () => {
  const app = {
    use: jest.fn(),
    listen: (...args) => mockListenFn(...args),
  };
  const expressFn = jest.fn(() => app);
  expressFn.json = jest.fn(() => jest.fn());
  expressFn.static = jest.fn(() => jest.fn());
  expressFn.Router = jest.fn(() => mockRouter);
  return expressFn;
});

jest.mock('cors', () => jest.fn(() => jest.fn()));
jest.mock('dotenv', () => ({ config: jest.fn() }));

// Route mocks
jest.mock('../routes/authRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/userRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/roleRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/permissionRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/contactRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/faqsRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/groupRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/categoryRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/optionRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/triatRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/progressRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/resultRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/answerRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/questionRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/testRoutes', () => mockRouter, { virtual: true });
jest.mock('../routes/organizationRoutes', () => mockRouter, { virtual: true });

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a SequelizeDatabaseError-like object that mimics what Sequelize throws
 * when MySQL returns errno 1932.
 */
function makeErrno1932Error() {
  const original = new Error("Table 'alpha_psycho.tests' doesn't exist in engine");
  original.errno = 1932;
  original.sqlState = 'HY000';
  original.sqlMessage = "Table 'alpha_psycho.tests' doesn't exist in engine";
  original.code = 'ER_TABLE_EXISTS_ERROR';

  const err = new Error("Table 'alpha_psycho.tests' doesn't exist in engine");
  err.name = 'SequelizeDatabaseError';
  err.original = original;
  err.parent = original;
  err.sql = 'SHOW FULL COLUMNS FROM `tests`';
  return err;
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('Bug Condition: errno 1932 — Table does not exist in engine', () => {
  let consoleErrorSpy;
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.resetModules();
    mockListenFn.mockReset();
    mockSyncImpl.mockReset();

    // Spy on console.error to capture what the .catch handler logs
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Spy on console.log to verify "Database synced" is NOT logged
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Spy on process.exit to verify it is NOT called in the unfixed code
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 1a — Bug Condition:
   * When db.sequelize.sync throws errno 1932, the server MUST NOT start.
   *
   * On UNFIXED code: app.listen is never called → this assertion PASSES,
   * confirming the bug condition (server never starts when errno 1932 occurs).
   *
   * Validates: Requirements 1.1, 1.3
   */
  test('Property 1a: app.listen is NOT called when errno 1932 is thrown', async () => {
    const errno1932Error = makeErrno1932Error();
    mockSyncImpl.mockRejectedValue(errno1932Error);

    // Load server.js — this triggers the sync call
    require('../server');

    // Wait for the promise chain to settle
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: app.listen must NOT have been called
    // On unfixed code this PASSES — confirming the server never starts on errno 1932
    expect(mockListenFn).not.toHaveBeenCalled();
  });

  /**
   * Property 1b — Bug Condition (unfixed behavior):
   * The current .catch handler logs the raw error with "DB Connection Error:"
   * but does NOT log an actionable repair message mentioning errno 1932 or
   * repair steps.
   *
   * On UNFIXED code: console.error is called with "DB Connection Error:" and
   * the raw error object — no mention of "FATAL", "InnoDB", or repair steps.
   * This assertion PASSES on unfixed code, documenting the broken behavior.
   *
   * Validates: Requirements 1.3
   */
  test('Property 1b: .catch handler logs raw error without actionable repair message (unfixed behavior)', async () => {
    const errno1932Error = makeErrno1932Error();
    mockSyncImpl.mockRejectedValue(errno1932Error);

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: console.error was called (the .catch handler fired)
    expect(consoleErrorSpy).toHaveBeenCalled();

    // ASSERTION: The error was logged with the generic "DB Connection Error:" prefix
    // This is the UNFIXED behavior — no actionable message
    const errorCalls = consoleErrorSpy.mock.calls;
    const hasGenericMessage = errorCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('DB Connection Error:')
    );
    expect(hasGenericMessage).toBe(true);

    // ASSERTION: No actionable FATAL message was logged (unfixed behavior)
    // After the fix, a "FATAL: MySQL InnoDB inconsistency detected" message should appear
    const hasFatalMessage = errorCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('FATAL')
    );
    expect(hasFatalMessage).toBe(false); // PASSES on unfixed code — no FATAL message

    // ASSERTION: "Database synced" was NOT logged (server never completed sync)
    const logCalls = consoleLogSpy.mock.calls;
    const hasDatabaseSynced = logCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('Database synced')
    );
    expect(hasDatabaseSynced).toBe(false);
  });

  /**
   * Property 1c — Bug Condition (unfixed behavior):
   * The current .catch handler does NOT call process.exit(1).
   * After the fix, process.exit(1) will be added for explicit failure signaling.
   *
   * On UNFIXED code: process.exit is never called → this assertion PASSES,
   * documenting the missing explicit failure signal.
   *
   * Validates: Requirements 1.3
   */
  test('Property 1c: process.exit(1) is NOT called by the unfixed .catch handler', async () => {
    const errno1932Error = makeErrno1932Error();
    mockSyncImpl.mockRejectedValue(errno1932Error);

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: process.exit was NOT called (unfixed behavior — no explicit exit)
    // After the fix, process.exit(1) will be called
    expect(processExitSpy).not.toHaveBeenCalled();
  });
});

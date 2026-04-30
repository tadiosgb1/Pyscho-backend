/**
 * Preservation Property Tests — Baseline Behavior
 *
 * Property 2: Preservation — Other Tables and Endpoints Unaffected
 *
 * These tests document the baseline behavior that MUST be preserved after the fix
 * is applied. All tests in this file PASS on the current UNFIXED server.js.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
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
 * Build a non-1932 database error (e.g., errno 2003 — connection refused).
 * This simulates a generic connection failure unrelated to the InnoDB bug.
 */
function makeConnectionRefusedError() {
  const original = new Error("connect ECONNREFUSED 127.0.0.1:3306");
  original.errno = 2003;
  original.sqlState = null;
  original.sqlMessage = "Can't connect to MySQL server on '127.0.0.1' (111)";
  original.code = 'ECONNREFUSED';

  const err = new Error("connect ECONNREFUSED 127.0.0.1:3306");
  err.name = 'SequelizeConnectionRefusedError';
  err.original = original;
  err.parent = original;
  return err;
}

/**
 * Build a SequelizeDatabaseError-like object that mimics errno 1932.
 * Used to verify isolation — only the tests table is affected.
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

/**
 * Build an authentication failure error (errno 1045 — access denied).
 */
function makeAuthFailureError() {
  const original = new Error("Access denied for user 'root'@'localhost' (using password: YES)");
  original.errno = 1045;
  original.sqlState = '28000';
  original.sqlMessage = "Access denied for user 'root'@'localhost' (using password: YES)";
  original.code = 'ER_ACCESS_DENIED_ERROR';

  const err = new Error("Access denied for user 'root'@'localhost' (using password: YES)");
  err.name = 'SequelizeAccessDeniedError';
  err.original = original;
  err.parent = original;
  return err;
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('Preservation: Baseline behavior that must not regress after the fix', () => {
  let consoleErrorSpy;
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.resetModules();
    mockListenFn.mockReset();
    mockSyncImpl.mockReset();

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Property 2a: Non-1932 errors still use the generic handler ────────────

  /**
   * Property 2a-i: When db.sequelize.sync throws a non-1932 error (errno 2003 —
   * connection refused), the .catch handler MUST log "DB Connection Error:" with
   * the raw error object.
   *
   * This PASSES on unfixed code — the generic handler is already in place.
   * After the fix, this behavior must be preserved for non-1932 errors.
   *
   * Validates: Requirements 3.2, 3.4
   */
  test('Property 2a-i: Non-1932 error (errno 2003) logs "DB Connection Error:" with raw error', async () => {
    const connectionError = makeConnectionRefusedError();
    mockSyncImpl.mockRejectedValue(connectionError);

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: console.error was called (the .catch handler fired)
    expect(consoleErrorSpy).toHaveBeenCalled();

    // ASSERTION: The generic "DB Connection Error:" prefix was used
    const errorCalls = consoleErrorSpy.mock.calls;
    const hasGenericMessage = errorCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('DB Connection Error:')
    );
    expect(hasGenericMessage).toBe(true);
  });

  /**
   * Property 2a-ii: When db.sequelize.sync throws a non-1932 error (errno 1045 —
   * auth failure), the .catch handler MUST log "DB Connection Error:" with the
   * raw error object.
   *
   * This PASSES on unfixed code.
   *
   * Validates: Requirements 3.2, 3.4
   */
  test('Property 2a-ii: Non-1932 error (errno 1045 auth failure) logs "DB Connection Error:" with raw error', async () => {
    const authError = makeAuthFailureError();
    mockSyncImpl.mockRejectedValue(authError);

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();

    // ASSERTION: The generic "DB Connection Error:" prefix was used
    const errorCalls = consoleErrorSpy.mock.calls;
    const hasGenericMessage = errorCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('DB Connection Error:')
    );
    expect(hasGenericMessage).toBe(true);
  });

  // ─── Property 2b: errno 1932 handler isolation ────────────────────────────

  /**
   * Property 2b: When errno 1932 occurs, the .catch handler behavior is scoped
   * to the error type — it fires once and does not affect other model tables.
   *
   * We verify this by confirming the .catch handler fires exactly once (not
   * multiple times for each model table), and that app.listen is NOT called
   * (the error is isolated to the sync failure, not a cascade).
   *
   * This PASSES on unfixed code.
   *
   * Validates: Requirements 3.1, 3.4
   */
  test('Property 2b: errno 1932 catch handler fires once — not once per model table', async () => {
    const errno1932Error = makeErrno1932Error();
    mockSyncImpl.mockRejectedValue(errno1932Error);

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: console.error was called (the .catch handler fired)
    expect(consoleErrorSpy).toHaveBeenCalled();

    // ASSERTION: The .catch handler fires exactly once — not once per model table.
    // If the handler were called per-table, it would be called ~15+ times.
    // The single sync() call means the catch fires at most once.
    const errorCalls = consoleErrorSpy.mock.calls;
    const genericMessageCount = errorCalls.filter(
      call => typeof call[0] === 'string' && call[0].includes('DB Connection Error:')
    ).length;
    expect(genericMessageCount).toBe(1);

    // ASSERTION: app.listen was NOT called — the error is isolated to the sync
    // failure and does not cascade into partial route mounting
    expect(mockListenFn).not.toHaveBeenCalled();
  });

  // ─── Property 2c: Non-1932 errors do NOT trigger FATAL message ────────────

  /**
   * Property 2c-i: When a connection refused error (errno 2003) occurs, the
   * handler MUST NOT log a "FATAL" InnoDB message.
   *
   * This PASSES on unfixed code — the FATAL message is only added by the fix
   * for errno 1932 specifically.
   *
   * Validates: Requirements 3.2, 3.4
   */
  test('Property 2c-i: Connection refused error (errno 2003) does NOT log a FATAL InnoDB message', async () => {
    const connectionError = makeConnectionRefusedError();
    mockSyncImpl.mockRejectedValue(connectionError);

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: No "FATAL" message was logged for a non-1932 error
    const errorCalls = consoleErrorSpy.mock.calls;
    const hasFatalMessage = errorCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('FATAL')
    );
    expect(hasFatalMessage).toBe(false);
  });

  /**
   * Property 2c-ii: When an auth failure error (errno 1045) occurs, the
   * handler MUST NOT log a "FATAL" InnoDB message.
   *
   * This PASSES on unfixed code.
   *
   * Validates: Requirements 3.2, 3.4
   */
  test('Property 2c-ii: Auth failure error (errno 1045) does NOT log a FATAL InnoDB message', async () => {
    const authError = makeAuthFailureError();
    mockSyncImpl.mockRejectedValue(authError);

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: No "FATAL" message was logged for a non-1932 error
    const errorCalls = consoleErrorSpy.mock.calls;
    const hasFatalMessage = errorCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('FATAL')
    );
    expect(hasFatalMessage).toBe(false);
  });

  // ─── Property 2d: Successful sync mounts all routes and calls app.listen ──

  /**
   * Property 2d: When db.sequelize.sync resolves successfully, app.listen IS
   * called and all routes are mounted via app.use.
   *
   * This PASSES on current code — the happy path works correctly.
   * After the fix, this behavior must continue to work.
   *
   * Validates: Requirements 2.3, 3.1, 3.2
   */
  test('Property 2d: Successful sync calls app.listen and mounts all routes', async () => {
    // Simulate a successful sync
    mockSyncImpl.mockResolvedValue(undefined);

    // Capture the express app mock to inspect app.use calls
    const express = require('express');
    const app = express();

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: app.listen WAS called (server started)
    expect(mockListenFn).toHaveBeenCalled();

    // ASSERTION: "Database synced" was logged
    const logCalls = consoleLogSpy.mock.calls;
    const hasDatabaseSynced = logCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('Database synced')
    );
    expect(hasDatabaseSynced).toBe(true);

    // ASSERTION: app.use was called multiple times — routes were mounted
    // server.js mounts at least: cors, json, static, and all API routes
    expect(app.use).toHaveBeenCalled();
    const useCalls = app.use.mock.calls;
    expect(useCalls.length).toBeGreaterThan(5); // at minimum: cors, json, static, auth, users, roles...

    // ASSERTION: No error was logged on successful sync
    const errorCalls = consoleErrorSpy.mock.calls;
    const hasAnyError = errorCalls.some(
      call => typeof call[0] === 'string' && call[0].includes('DB Connection Error:')
    );
    expect(hasAnyError).toBe(false);
  });

  /**
   * Property 2d-ii: When sync succeeds, the key API route prefixes are mounted.
   *
   * This PASSES on current code.
   *
   * Validates: Requirements 2.3, 3.2
   */
  test('Property 2d-ii: Successful sync mounts key API route prefixes', async () => {
    mockSyncImpl.mockResolvedValue(undefined);

    const express = require('express');
    const app = express();

    require('../server');

    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // ASSERTION: app.listen was called
    expect(mockListenFn).toHaveBeenCalled();

    // ASSERTION: Key route prefixes are mounted
    const useCalls = app.use.mock.calls;
    const mountedPaths = useCalls
      .filter(call => typeof call[0] === 'string')
      .map(call => call[0]);

    // These routes are mounted before the sync (in server.js top-level)
    expect(mountedPaths).toContain('/api/auth');
    expect(mountedPaths).toContain('/api/users');
    expect(mountedPaths).toContain('/api/roles');
    expect(mountedPaths).toContain('/api/permissions');

    // These routes are mounted inside the .then() callback
    expect(mountedPaths).toContain('/api/test');
    expect(mountedPaths).toContain('/api/question');
    expect(mountedPaths).toContain('/api/answer');
  });
});

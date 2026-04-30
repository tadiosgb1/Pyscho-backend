# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - InnoDB Tablespace Missing (errno 1932)
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate errno 1932 is raised when the `tests` table exists in the data dictionary but its `.ibd` file is missing
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — simulate the inconsistent database state (data dictionary entry present, `.ibd` file absent) and assert that `db.sequelize.sync({ alter: true })` completes without error
  - Simulate the bug condition: in a test MySQL instance, create the `tests` table, stop MySQL, delete `tests.ibd` from the data directory, restart MySQL
  - Run `db.sequelize.sync({ alter: true })` against the inconsistent state
  - Assert that the sync does NOT throw a `SequelizeDatabaseError` with `errno: 1932` and `sqlState: 'HY000'`
  - Assert that `"Database synced"` is logged and `app.listen()` is called
  - Run test on UNFIXED code (before `DROP TABLE IF EXISTS \`tests\`` repair)
  - **EXPECTED OUTCOME**: Test FAILS — the sync throws errno 1932 and the server never starts (this proves the bug exists)
  - Document counterexamples found: e.g., `SHOW FULL COLUMNS FROM \`tests\`` returns `ERROR 1932 (HY000): Table 'alpha_psycho.tests' doesn't exist in engine`
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Other Tables and Endpoints Unaffected
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: on unfixed code (with the `tests` inconsistency present), run `SHOW CREATE TABLE` for each healthy model table (`users`, `roles`, `permissions`, `questions`, `answers`, `results`, `progress`, `triats`, `options`, `categories`, `groups`, `organizations`, `faqs`, `contacts`) and record their schemas
  - Observe: confirm `sync({ alter: true })` for all non-`tests` tables completes without error even when the `tests` entry is broken
  - Write property-based test: for all model tables where `isBugCondition` does NOT hold (table exists in data dictionary AND `.ibd` file is intact), assert that `SHOW CREATE TABLE <table>` returns the same schema before and after the repair procedure
  - Write property-based test: for all API endpoints (`/api/auth`, `/api/users`, `/api/roles`, `/api/permissions`, etc.), assert that each endpoint responds correctly after the repair — same status codes and response shapes as before
  - Write unit test: assert that the `.catch` handler in `server.js` still logs the generic `"DB Connection Error"` for non-1932 errors (e.g., errno 2003 — connection refused)
  - Verify all preservation tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - **EXPECTED OUTCOME**: Tests PASS — confirms the baseline behavior that must not regress
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [~] 3. Fix for MySQL InnoDB errno 1932 — orphaned `tests` data dictionary entry

  - [~] 3.1 Execute database-level repair procedure
    - Connect to MySQL as a privileged user: `USE alpha_psycho;`
    - Verify the inconsistency: run `SHOW TABLES LIKE 'tests';` (should return one row) and `SHOW FULL COLUMNS FROM \`tests\`;` (should return errno 1932)
    - Drop the orphaned data dictionary entry: `DROP TABLE IF EXISTS \`tests\`;`
    - The `IF EXISTS` clause prevents an error if the entry was already cleaned up
    - No data is lost — the `.ibd` tablespace was already missing, so the table was effectively inaccessible
    - _Bug_Condition: isBugCondition(dbState) where tableExistsInDataDictionary(dbState, 'tests') AND NOT tablespaceFileExists(dbState, 'tests') AND sequelizeSyncAlterIsCalledOnStartup()_
    - _Expected_Behavior: db.sequelize.sync({ alter: true }) completes without error; server logs "Database synced"; app.listen() is called on the configured PORT; SHOW FULL COLUMNS FROM `tests` returns the correct schema (id, title, description, duration, created_by, createdAt, updatedAt)_
    - _Preservation: All other model tables (users, roles, permissions, questions, answers, results, progress, triats, options, categories, groups, organizations, faqs, contacts) are completely unaffected — schemas unchanged, sync behavior unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [~] 3.2 Update `.catch` handler in `server.js` with errno 1932 safeguard
    - Replace the current single-line `.catch(err => console.error("DB Connection Error:", err))` with a handler that checks `err.original && err.original.errno === 1932`
    - When errno 1932 is detected, log a FATAL message with the affected table name (extracted from `err.original.sqlMessage`) and step-by-step repair instructions
    - For all other errors, continue logging the generic `"DB Connection Error:"` message (preserves existing behavior)
    - Add `process.exit(1)` at the end of the catch handler (both branches) for explicit failure signaling in process managers and Docker restart policies
    - This change is purely diagnostic — it does not alter sync behavior and does not affect healthy tables
    - _Bug_Condition: err.original.errno === 1932 in the .catch handler_
    - _Expected_Behavior: FATAL message logged with table name and repair steps; process.exit(1) called_
    - _Preservation: Non-1932 errors still log "DB Connection Error:" as before; process.exit(1) added for all failures_
    - _Requirements: 2.1, 2.3, 3.2_

  - [~] 3.3 Restart the server after the database repair
    - In Docker Compose environments: `docker compose restart backend`
    - Or directly: `node server.js`
    - Sequelize's `sync({ alter: true })` will now find no `tests` table (errno 1146 path — table simply absent), create it fresh from the `Test` model definition, and the server will start normally
    - Verify: `SHOW FULL COLUMNS FROM \`tests\`` returns clean output with `id`, `title`, `description`, `duration`, `created_by`, `createdAt`, `updatedAt` columns
    - Verify: `SHOW CREATE TABLE \`tests\`` matches the `Test` model definition in `models/Test.js`
    - _Requirements: 2.1, 2.2, 2.3_

  - [~] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - InnoDB Tablespace Missing (errno 1932)
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior: `db.sequelize.sync({ alter: true })` completes without error after the repair
    - Run bug condition exploration test from step 1 against the repaired database state
    - **EXPECTED OUTCOME**: Test PASSES — confirms the errno 1932 bug is resolved and the server starts successfully
    - _Requirements: 2.1, 2.2, 2.3_

  - [~] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Other Tables and Endpoints Unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2 against the post-repair state
    - Confirm all other model table schemas are identical to the baseline recorded in task 2
    - Confirm all API endpoints respond correctly
    - Confirm the `.catch` handler still logs `"DB Connection Error:"` for non-1932 errors
    - **EXPECTED OUTCOME**: Tests PASS — confirms no regressions introduced by the repair or the `server.js` change
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [~] 4. Checkpoint — Ensure all tests pass
  - Re-run the full test suite: bug condition exploration test (task 1), preservation property tests (task 2), and all unit tests for the `.catch` handler
  - Confirm `db.sequelize.sync({ alter: true })` completes without error on a clean restart
  - Confirm `SHOW CREATE TABLE \`tests\`` shows the correct schema matching `models/Test.js`
  - Confirm all API endpoints (`/api/test`, `/api/auth`, `/api/users`, etc.) are reachable and return expected responses
  - Confirm `process.exit(1)` is called on any sync failure (both errno 1932 and other errors)
  - Restart the server a second time to verify idempotency — `sync({ alter: true })` must complete without error again
  - Ask the user if any questions arise before closing the spec

# tests-table-not-exist-engine Bugfix Design

## Overview

The `tests` table has an orphaned entry in MySQL's data dictionary — the table is known to the MySQL server but its InnoDB tablespace file (`.ibd`) is missing or corrupted. When `db.sequelize.sync({ alter: true })` runs on startup, Sequelize issues `SHOW FULL COLUMNS FROM \`tests\`` which triggers MySQL errno 1932, causing the entire sync to fail and the server to never start.

The fix is a database-level repair procedure: drop the orphaned data dictionary entry with `DROP TABLE IF EXISTS \`tests\`;`, then restart the server so Sequelize recreates the table cleanly via `sync({ alter: true })`. No application data is lost because the tablespace was already missing — the table was effectively inaccessible.

Optionally, a code-level safeguard can be added to `server.js` to detect errno 1932 at startup and emit a clear, actionable error message rather than a raw Sequelize stack trace.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the `tests` table entry exists in the MySQL data dictionary but its InnoDB tablespace file is missing or corrupted, causing errno 1932 when Sequelize attempts to inspect or alter the table
- **Property (P)**: The desired behavior after the fix — `db.sequelize.sync({ alter: true })` completes without error and the server starts successfully
- **Preservation**: All other models sync normally, all existing API endpoints remain reachable, and the `Test` model continues to map to the `tests` table with the same schema
- **errno 1932**: MySQL InnoDB error "Table '...' doesn't exist in engine" — distinct from errno 1146 ("Table doesn't exist"); 1932 means the data dictionary has the table but the physical `.ibd` file is gone or corrupt
- **InnoDB tablespace file (`.ibd`)**: The physical file on disk that stores a table's data and indexes when `innodb_file_per_table` is enabled
- **Data dictionary**: MySQL's internal metadata store that tracks table definitions independently of the physical storage files
- **`db.sequelize.sync({ alter: true })`**: Sequelize startup call in `server.js` that inspects each model's current table schema via `SHOW FULL COLUMNS` and applies any structural differences
- **`SHOW FULL COLUMNS FROM \`tests\``**: The specific SQL statement Sequelize issues during `alter` sync that triggers errno 1932 when the tablespace is missing

## Bug Details

### Bug Condition

The bug manifests when `db.sequelize.sync({ alter: true })` is called during server startup and the `tests` table is in an inconsistent state: present in the MySQL data dictionary but missing its InnoDB tablespace file. Sequelize's `alter` sync issues `SHOW FULL COLUMNS FROM \`tests\`` to compare the live schema against the model definition, and MySQL cannot fulfill this query because the storage engine has no physical file to read.

**Formal Specification:**
```
FUNCTION isBugCondition(dbState)
  INPUT: dbState — the state of the MySQL database at startup time
  OUTPUT: boolean

  RETURN tableExistsInDataDictionary(dbState, 'tests')
         AND NOT tablespaceFileExists(dbState, 'tests')   -- .ibd file missing or corrupt
         AND sequeleSyncAlterIsCalledOnStartup()
END FUNCTION
```

### Examples

- **Triggering case**: Server restarts after the MySQL data directory was partially restored from backup — the `tests.ibd` file was not included in the restore but the data dictionary entry survived. `SHOW FULL COLUMNS FROM \`tests\`` returns errno 1932. Server never starts.
- **Triggering case**: The `tests.ibd` file was manually deleted from the filesystem while MySQL was running. MySQL still shows the table in `SHOW TABLES` but cannot read it. Sync fails on next startup.
- **Triggering case**: A Docker volume was recreated or partially wiped, leaving the MySQL system tablespace intact (data dictionary) but removing per-table `.ibd` files. Same errno 1932 on sync.
- **Non-triggering case**: The `tests` table is completely absent (errno 1146 — "Table doesn't exist"). Sequelize's `alter` sync would create the table fresh without error. This is a different error code and is handled correctly.
- **Non-triggering case**: The `tests` table exists and its `.ibd` file is healthy. `SHOW FULL COLUMNS` succeeds, sync proceeds normally.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All other models (`users`, `roles`, `permissions`, `questions`, `answers`, `results`, `progress`, `triats`, `options`, `categories`, `groups`, `organizations`, `faqs`, `contacts`) must continue to sync via `alter` without being dropped or recreated
- All existing API endpoints (`/api/auth`, `/api/users`, `/api/roles`, `/api/permissions`, `/api/test`, `/api/question`, etc.) must remain reachable after the fix is applied
- The `Test` Sequelize model must continue to map to the `tests` table with the same schema: `id`, `title`, `description`, `duration`, `created_by` (FK → `users.id`)
- The `.catch` error handler in `server.js` must continue to log errors for any other sync failures that are not errno 1932

**Scope:**
All tables that are healthy and consistent (data dictionary entry + intact `.ibd` file) must be completely unaffected by this fix. The repair procedure targets only the orphaned `tests` entry. This includes:
- All other model tables in the `alpha_psycho` database
- Any future tables added via new Sequelize models
- The `sync({ alter: true })` behavior for non-corrupted tables (alter columns, add indexes, etc.)

## Hypothesized Root Cause

Based on the bug description and MySQL errno 1932 semantics, the root cause is a **physical/logical inconsistency in the InnoDB storage layer**, not a code defect:

1. **Missing `.ibd` tablespace file**: The most common cause. When `innodb_file_per_table=ON` (the default since MySQL 5.6), each table has its own `.ibd` file. If this file is deleted, moved, or not restored from backup while the data dictionary entry survives, errno 1932 is raised on any attempt to access the table.
   - Likely scenario: Docker volume partial wipe, incomplete backup restore, or manual filesystem operation

2. **Corrupted `.ibd` file**: The file exists on disk but InnoDB cannot read it (bad sectors, truncated file, wrong format). MySQL reports the same errno 1932.

3. **Data dictionary / `.ibd` mismatch after import**: If the database was imported using `mysqldump` for some tables but not others, or if `.ibd` files were copied between MySQL instances with different `innodb_file_per_table` settings, the dictionary and storage layer can diverge.

4. **No application code defect**: The `server.js` sync call and the `Test` model definition are correct. The bug is entirely at the MySQL storage layer. The only code-level gap is that the `.catch` handler logs the raw error without distinguishing errno 1932 from other sync failures, making diagnosis harder.

## Correctness Properties

Property 1: Bug Condition — InnoDB Inconsistency Repaired

_For any_ database state where the bug condition holds (isBugCondition returns true — `tests` entry in data dictionary but `.ibd` file missing), after executing the repair procedure (`DROP TABLE IF EXISTS \`tests\``) and restarting the server, `db.sequelize.sync({ alter: true })` SHALL complete without error, the server SHALL log `"Database synced"`, and the server SHALL start and listen on the configured port.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Other Tables and Endpoints Unaffected

_For any_ database state where the bug condition does NOT hold (all other tables are healthy), the repair procedure SHALL NOT alter, drop, or recreate any table other than `tests`, and `db.sequelize.sync({ alter: true })` SHALL produce the same outcome for all other models as it would without the repair procedure applied.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

This is a **database-level repair procedure**, not a code change. The steps below must be executed once to resolve the inconsistency. An optional code-level safeguard is described separately.

---

**Step 1 — Connect to MySQL as a privileged user**

```sql
-- Connect to the affected database
USE alpha_psycho;
```

**Step 2 — Verify the inconsistency (diagnostic)**

```sql
-- Confirm the table appears in the data dictionary
SHOW TABLES LIKE 'tests';

-- Attempt to describe it — this should return errno 1932
SHOW FULL COLUMNS FROM `tests`;
```

Expected output of `SHOW TABLES`: one row (`tests`).  
Expected output of `SHOW FULL COLUMNS`: ERROR 1932 (HY000): Table 'alpha_psycho.tests' doesn't exist in engine.

**Step 3 — Drop the orphaned data dictionary entry**

```sql
-- Remove the stale data dictionary entry.
-- IF EXISTS prevents an error if the entry was already cleaned up.
DROP TABLE IF EXISTS `tests`;
```

This removes only the data dictionary entry. Since the `.ibd` file is already missing, no data is lost.

**Step 4 — Restart the Node.js server**

```bash
# In Docker Compose environments:
docker compose restart backend

# Or directly:
node server.js
```

Sequelize's `sync({ alter: true })` will now find no `tests` table (errno 1146 path — table simply absent), create it fresh from the `Test` model definition, and the server will start normally.

**Step 5 — Verify**

```sql
-- Confirm the table was recreated with the correct schema
SHOW FULL COLUMNS FROM `tests`;
SHOW CREATE TABLE `tests`;
```

Expected: clean output showing `id`, `title`, `description`, `duration`, `created_by` columns.

---

### Optional Code-Level Safeguard

**File**: `server.js`

**Function**: `.catch` handler on `db.sequelize.sync()`

**Purpose**: Distinguish errno 1932 from other sync errors and emit a clear, actionable message instead of a raw stack trace.

**Specific Change**:

```javascript
// Before (current):
.catch(err => console.error("DB Connection Error:", err));

// After (with errno 1932 safeguard):
.catch(err => {
  if (err.original && err.original.errno === 1932) {
    console.error(
      "FATAL: MySQL InnoDB inconsistency detected.\n" +
      `Table '${err.original.sqlMessage?.match(/Table '([^']+)'/)?.[1] ?? 'unknown'}' ` +
      "exists in the data dictionary but its InnoDB tablespace file (.ibd) is missing or corrupted.\n" +
      "Repair steps:\n" +
      "  1. Connect to MySQL and run: DROP TABLE IF EXISTS `<table_name>`;\n" +
      "  2. Restart the server — Sequelize will recreate the table from the model definition.\n" +
      "Original error:", err.message
    );
  } else {
    console.error("DB Connection Error:", err);
  }
  process.exit(1);
});
```

This change is purely diagnostic — it does not alter sync behavior, does not affect healthy tables, and adds `process.exit(1)` to make the failure explicit in process managers and Docker restart policies.

## Testing Strategy

### Validation Approach

Because this is a database-level repair rather than a code change, the testing strategy focuses on:
1. **Exploratory checking** — reproduce the errno 1932 condition to confirm the root cause before applying the fix
2. **Fix checking** — verify the repair procedure resolves the condition and the server starts cleanly
3. **Preservation checking** — verify all other tables and endpoints are unaffected

### Exploratory Bug Condition Checking

**Goal**: Surface the errno 1932 failure to confirm the root cause analysis before applying the repair. If the error is different (e.g., errno 1146, errno 2003), the root cause hypothesis must be revised.

**Test Plan**: Simulate the inconsistent database state in a local or staging environment, then attempt to start the server and observe the exact error.

**Test Cases**:

1. **Simulate missing `.ibd` file**: In a test MySQL instance, create the `tests` table, then stop MySQL, delete `tests.ibd` from the data directory, restart MySQL, and attempt `SHOW FULL COLUMNS FROM \`tests\``. Expected: errno 1932. (Will fail — confirms the bug condition)

2. **Attempt server startup with inconsistent state**: With the simulated inconsistency in place, run `node server.js`. Expected: `.catch` handler fires with errno 1932, server does not start. (Will fail — confirms the bug manifests at startup)

3. **Verify `SHOW TABLES` still lists `tests`**: Confirm the data dictionary entry is present despite the missing tablespace. Expected: `tests` appears in `SHOW TABLES`. (Confirms the orphaned entry that needs to be dropped)

4. **Attempt `DROP TABLE IF EXISTS \`tests\`` before fix**: Confirm the DROP succeeds even when the tablespace is missing. Expected: Query succeeds (MySQL handles this case). (Confirms the repair step is executable)

**Expected Counterexamples**:
- `db.sequelize.sync({ alter: true })` throws `SequelizeDatabaseError` with `errno: 1932` and `sqlState: 'HY000'`
- The error originates from the `SHOW FULL COLUMNS FROM \`tests\`` query issued by Sequelize's alter introspection
- The `.catch` handler in `server.js` logs the error but the server never calls `app.listen()`

### Fix Checking

**Goal**: Verify that after the repair procedure, the bug condition no longer holds and the server starts successfully.

**Pseudocode:**
```
GIVEN database state WHERE isBugCondition(dbState) = true
WHEN  DROP TABLE IF EXISTS `tests` is executed
AND   server.js is restarted
THEN  db.sequelize.sync({ alter: true }) completes without error
AND   server logs "Database synced"
AND   app.listen() is called on the configured PORT
AND   SHOW FULL COLUMNS FROM `tests` returns the correct schema
```

**Test Cases**:

1. **Post-repair sync success**: After running `DROP TABLE IF EXISTS \`tests\``, start the server and confirm `"Database synced"` is logged and no errno 1932 is thrown.

2. **Schema correctness**: After Sequelize recreates the table, run `SHOW CREATE TABLE \`tests\`` and verify columns match the `Test` model definition: `id INT AUTO_INCREMENT PRIMARY KEY`, `title VARCHAR(255)`, `description VARCHAR(255)`, `duration VARCHAR(255)`, `created_by INT` (FK → `users.id`), plus Sequelize's `createdAt` and `updatedAt` timestamps.

3. **API endpoint reachability**: After server start, send a request to `GET /api/test` and confirm a valid HTTP response (not a connection refused or 500 from a failed sync).

### Preservation Checking

**Goal**: Verify that the repair procedure does not affect any other table or endpoint.

**Pseudocode:**
```
FOR ALL table IN database WHERE table != 'tests' DO
  ASSERT tableSchema_before_repair = tableSchema_after_repair
END FOR

FOR ALL endpoint IN api_routes DO
  ASSERT endpoint_responds_correctly_after_repair
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it can generate many combinations of model operations across all tables and verify consistent behavior before and after the repair.

**Test Cases**:

1. **Other tables schema preservation**: Before and after the repair, run `SHOW CREATE TABLE` for each model table (`users`, `roles`, `permissions`, `questions`, `answers`, `results`, `progress`, `triats`, `options`, `categories`, `groups`, `organizations`, `faqs`, `contacts`) and assert the schemas are identical.

2. **Auth endpoint preservation**: After the repair and server restart, send `POST /api/auth/login` with valid credentials and confirm the response is the same as before the repair.

3. **Other model CRUD preservation**: Perform a read operation on at least one non-`tests` model (e.g., `GET /api/users`) and confirm it returns data correctly, verifying that `sync({ alter: true })` did not inadvertently alter those tables.

4. **`sync({ alter: true })` idempotency for healthy tables**: Restart the server a second time after the repair and confirm `sync({ alter: true })` completes without error again, verifying that the recreated `tests` table is now stable.

### Unit Tests

- Test that the optional errno 1932 safeguard in `.catch` correctly identifies `err.original.errno === 1932` and logs the actionable repair message
- Test that the `.catch` handler still logs the generic "DB Connection Error" for non-1932 errors (e.g., errno 2003 — connection refused)
- Test that `process.exit(1)` is called on any sync failure (both 1932 and other errors)

### Property-Based Tests

- Generate random sets of model tables (excluding `tests`) and verify that `sync({ alter: true })` produces identical schemas before and after the repair procedure — preservation across all table combinations
- Generate random valid payloads for the `Test` model (title, description, duration, created_by) and verify that after the repair, all CRUD operations on the recreated `tests` table succeed without error
- Generate random sequences of server restarts after the repair and verify that each restart completes sync successfully (idempotency property)

### Integration Tests

- Full startup integration test: simulate the errno 1932 condition, run the repair SQL, restart the server, and assert the full startup sequence completes (`"Database synced"` logged, port listening, all routes mounted)
- Cross-model integration test: after the repair, exercise the full test-taking flow (`POST /api/test` → `POST /api/question` → `POST /api/answer` → `GET /api/result`) and verify end-to-end correctness
- Docker environment test: reproduce the scenario in the Docker Compose environment (`docker-compose.yml`) by simulating a partial volume wipe, apply the repair, and verify the container starts cleanly

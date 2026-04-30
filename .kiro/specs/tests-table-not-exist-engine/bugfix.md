# Bugfix Requirements Document

## Introduction

When starting the Node.js/Express backend, `db.sequelize.sync({ alter: true })` fails with MySQL error 1932: `Table 'alpha_psycho.tests' doesn't exist in engine`. This is a MySQL InnoDB storage engine corruption issue — the `tests` table entry exists in MySQL's data dictionary but the underlying InnoDB tablespace file (`.ibd`) is missing or corrupted. As a result, the server fails to start and all API endpoints become unavailable.

This is distinct from errno 1146 ("Table doesn't exist"), which means the table is simply absent. Errno 1932 means MySQL is aware of the table but the InnoDB engine cannot find or access its physical storage file.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `db.sequelize.sync({ alter: true })` is called on startup THEN the system throws MySQL error 1932 (`Table 'alpha_psycho.tests' doesn't exist in engine`) and the server process exits with an unhandled rejection

1.2 WHEN Sequelize executes `SHOW FULL COLUMNS FROM \`tests\`` as part of the `alter` sync THEN the system receives errno 1932 / sqlState `42S02` because the InnoDB tablespace file for `tests` is missing or corrupted while the table still exists in the MySQL data dictionary

1.3 WHEN the sync error is caught by the `.catch` handler in `server.js` THEN the system logs the error but the server never starts, leaving all API routes unreachable

### Expected Behavior (Correct)

2.1 WHEN `db.sequelize.sync({ alter: true })` is called on startup THEN the system SHALL complete the sync successfully and the server SHALL start and listen on the configured port

2.2 WHEN Sequelize executes `SHOW FULL COLUMNS FROM \`tests\`` THEN the system SHALL be able to describe the table without error, because the InnoDB tablespace is consistent with the MySQL data dictionary

2.3 WHEN the database sync completes THEN the system SHALL log `"Database synced"` and all API routes (including `/api/test`) SHALL be mounted and reachable

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the server starts successfully THEN the system SHALL CONTINUE TO sync all other models (users, roles, permissions, questions, answers, results, etc.) without error

3.2 WHEN valid requests are made to existing API endpoints (e.g., `/api/auth`, `/api/users`, `/api/roles`) THEN the system SHALL CONTINUE TO handle those requests correctly after the fix is applied

3.3 WHEN the `Test` model is used via Sequelize (create, find, update, delete) THEN the system SHALL CONTINUE TO map operations to the `tests` table with the same schema (`id`, `title`, `description`, `duration`, `created_by`)

3.4 WHEN `db.sequelize.sync({ alter: true })` runs for tables that are healthy and consistent THEN the system SHALL CONTINUE TO alter those tables normally without dropping or recreating them

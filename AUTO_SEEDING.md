# Auto-Seeding Documentation

## Overview

The application now includes automatic database seeding that runs when the server starts for the first time. This ensures your database is populated with initial data without requiring manual seeding commands.

## How It Works

1. **On Server Start**: When `server.js` runs, it syncs the database and then checks if seeding is needed
2. **Smart Detection**: The system checks if the `organizations` table has any data
3. **Conditional Seeding**: 
   - If data exists → Skips seeding (shows: "Database already seeded")
   - If empty → Runs all seeders automatically
4. **One-Time Only**: Once seeded, the data persists and won't be re-seeded on subsequent server starts

## Benefits

✅ **No Manual Commands**: No need to run `npm run seed` separately  
✅ **Safe**: Won't overwrite existing data  
✅ **Automatic**: Works on first deployment or fresh database  
✅ **Preserves Data**: Existing data remains untouched  

## Manual Seeding (Still Available)

You can still manually run seeders if needed:

```bash
npm run seed
```

**Note**: The manual seed command (`run-all.js`) clears existing data before re-seeding. Use with caution!

## Files Modified

- **server.js**: Added auto-seed call after database sync
- **utility/autoSeed.js**: New utility that handles automatic seeding logic

## Seeding Order

The seeders run in this order:
1. Organizations
2. Users
3. Roles
4. Permissions
5. Role Permissions
6. User Roles
7. User Permissions
8. Categories
9. Triats
10. Tests
11. Questions
12. Options
13. Answers
14. Results
15. Progresses
16. Groups
17. Contacts
18. FAQs
19. User Groups
20. Test Assignments
21. Plans
22. Subscriptions
23. Invoices

## Troubleshooting

If auto-seeding fails:
- Check database connection settings in `.env`
- Ensure all tables are created (database sync completed)
- Check console logs for specific error messages
- Manually run: `npm run seed` to seed with detailed output

## Console Output

**First Run (Empty Database)**:
```
Database synced
📦 Database is empty. Running seeders...
🌱 Running initial database seeders...
  ✓ Seeded: 01-organizations
  ✓ Seeded: 02-users
  ...
✅ All seeders completed successfully.
Server running on port 5000
```

**Subsequent Runs (Already Seeded)**:
```
Database synced
ℹ️  Database already seeded. Skipping auto-seed.
Server running on port 5000
```

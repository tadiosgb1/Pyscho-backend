const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/UserGroupController");
const authMiddleware = require("../middleware/authMiddleware");

// List all memberships
router.get("/", controller.getAll);

// Get all users in a specific group
router.get("/group/:groupId", controller.getUsersByGroup);

// Get all groups a specific user belongs to
router.get("/user/:userId", controller.getGroupsByUser);

// Get a single membership record by its ID
router.get("/:id", controller.getOne);

// Add a single user to a group  { userId, groupId }
router.post("/", authMiddleware, controller.create);

// Add multiple users to a group at once  { groupId, userIds: [] }
router.post("/bulk", authMiddleware, controller.bulkAdd);

// Remove a membership by its own record ID
router.delete("/:id", authMiddleware, controller.delete);

// Remove a user from a group by userId + groupId
router.delete("/group/:groupId/user/:userId", authMiddleware, controller.removeUserFromGroup);

module.exports = router;

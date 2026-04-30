const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/TestAssignmentController");
const authMiddleware = require("../middleware/authMiddleware");

// ── List & filter all assignments
router.get("/", controller.getAll);

// ── All assignments for a specific user (direct + via groups)
router.get("/user/:userId", controller.getForUser);

// ── All assignments for a specific group
router.get("/group/:groupId", controller.getForGroup);

// ── Single assignment by ID
router.get("/:id", controller.getOne);

// ── Assign a test to one user or group
router.post("/", authMiddleware, controller.create);

// ── Assign a test to multiple users/groups at once
router.post("/bulk", authMiddleware, controller.bulkCreate);

// ── Update assignment status (pending → in_progress → completed | expired)
router.patch("/:id/status", authMiddleware, controller.updateStatus);

// ── Remove an assignment
router.delete("/:id", authMiddleware, controller.delete);

module.exports = router;

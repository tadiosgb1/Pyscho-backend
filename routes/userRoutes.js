const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const permissionMiddleware = require("../middleware/permissionMiddleware");
// Apply authMiddleware to protect the route and get user info for role-based filtering
router.get("/", authMiddleware, userController.getAll);
router.get("/:id", authMiddleware, userController.getOne);
router.put("/:id", authMiddleware, userController.update);
router.patch("/:id", authMiddleware, userController.patch);
router.delete("/:id", authMiddleware, userController.delete);
router.put("/:id/roles", authMiddleware, userController.assignRoles);
router.put("/:id/permissions", authMiddleware, userController.assignPermissions);
router.get("/:id/effective-permissions", authMiddleware, permissionMiddleware("view_user"), userController.getEffectivePermissions);
module.exports = router;
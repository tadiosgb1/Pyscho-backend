const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const authMiddleware = require("../middleware/authMiddleware");
const permissionMiddleware = require("../middleware/permissionMiddleware");
router.get("/", roleController.getAll);
router.get("/:id", authMiddleware, permissionMiddleware("view_role"), roleController.getOne);

//router.post("/", authMiddleware, permissionMiddleware("create_role"), roleController.create);
router.post("/",roleController.create);

router.put("/:id", authMiddleware,  roleController.update);
router.patch("/:id", authMiddleware, roleController.patch);
router.delete("/:id", authMiddleware, roleController.delete);
router.put("/:id/permissions", authMiddleware, roleController.assignPermissions);
module.exports = router;
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/PlanController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/",     controller.getAll);          // public — pricing page
router.get("/:id",  controller.getOne);          // public
router.post("/",    authMiddleware, controller.create);   // admin only
router.put("/:id",  authMiddleware, controller.update);   // admin only
router.delete("/:id", authMiddleware, controller.delete); // admin only (soft-delete)

module.exports = router;

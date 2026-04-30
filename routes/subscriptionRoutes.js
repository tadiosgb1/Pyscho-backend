const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/SubscriptionController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/",                              authMiddleware, controller.getAll);
router.get("/organization/:orgId",           controller.getForOrganization);  // used by org dashboard
router.get("/:id",                           authMiddleware, controller.getOne);
router.post("/",                             authMiddleware, controller.create);
router.patch("/:id/status",                  authMiddleware, controller.updateStatus);
router.patch("/:id/usage",                   authMiddleware, controller.updateUsage);

module.exports = router;

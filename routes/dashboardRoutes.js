const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/DashboardController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/stats", authMiddleware, controller.getStats);

module.exports = router;

const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/DashboardController");

router.get("/stats", controller.getStats);

module.exports = router;

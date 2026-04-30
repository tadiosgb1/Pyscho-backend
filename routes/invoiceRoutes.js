const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/InvoiceController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/",              authMiddleware, controller.getAll);
router.get("/:id",           authMiddleware, controller.getOne);
router.post("/",             authMiddleware, controller.create);
router.patch("/:id/pay",     authMiddleware, controller.markPaid);
router.patch("/:id/cancel",  authMiddleware, controller.cancel);

module.exports = router;

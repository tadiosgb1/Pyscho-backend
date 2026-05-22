const express = require("express");
const router = express.Router();
const controller = require("../controllers/OptionController");
const upload = require("../middleware/uploadMiddleware"); // 👈 Import your file upload configuration middleware

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);

// 💡 Attach the single file parsing middleware inside the patch pipeline:
router.patch("/:id", upload.single("option_file"), controller.update);

router.delete("/:id", controller.delete);

module.exports = router;
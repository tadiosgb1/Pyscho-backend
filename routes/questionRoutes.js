const express = require("express");
const router = express.Router();
const controller = require("../controllers/QuestionController");

// 2️⃣ Import your custom centralized middleware instance
const upload = require("../middleware/uploadMiddleware");

// Allow a dynamic limit array of option uploads matching the potential option array indexes
const optionFields = Array.from({ length: 20 }, (_, i) => ({ name: `option_file_${i}`, maxCount: 1 }));

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);

// 3️⃣ Pass the option fields array configuration cleanly into your middleware execution context
router.post("/", upload.fields(optionFields), controller.create);

router.put("/:id",  controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
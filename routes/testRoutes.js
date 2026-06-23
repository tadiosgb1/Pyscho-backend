const express = require("express");
const router = express.Router();
const controller = require("../controllers/TestController");
const auth = require("../middleware/authMiddleware");

router.get("/",           auth, controller.getAll);
router.get("/all",        auth, controller.getAllForAssignment); // all tests, no role filter — for assignment modals
router.get("/:id",        auth, controller.getOne);
router.post("/",          auth, controller.create);
router.put("/:id",        auth, controller.update);
router.delete("/:id",     auth, controller.delete);

module.exports = router;

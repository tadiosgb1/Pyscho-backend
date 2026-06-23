const express = require("express");
const router = express.Router();
const controller = require("../controllers/ResultController");

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.put("/:id/status", controller.updateStatus);
router.delete("/:id", controller.delete);

// Answers matrix: all questions for a test with what a specific user answered
router.get('/user/:userId/test/:testId/answers-matrix', controller.getAnswersMatrix);

module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../controllers/ResultController");

// Import your db instance to access all models correctly
const db = require('../models'); 
const Answer = db.Answer;
const Question = db.Question;

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/",  controller.create);
router.put("/:id",  controller.update);
router.put("/:id/status",  controller.updateStatus);
router.delete("/:id", controller.delete);

// FIXED ROUTE: Uses userId and testId since 'result_id' does not exist on your Answer model
router.get('/user/:userId/test/:testId/answers-matrix', async (req, res) => {
    console.log('Received request for answers matrix with params:', req.params);
  try {
    const { userId, testId } = req.params;
    console.log(`Received request for User ID: ${userId}, Test ID: ${testId}`);

    // Fetch all answers belonging to this user, filtering by the specific test through the Question model
    const answers = await Answer.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Question,
          where: { test_id: testId },
          // FIX: Replaced 'text' with common column names like 'title' or 'content'. 
          // Adjust ['id', 'title', 'type', 'test_id'] if your column is named 'question' or 'content'
          attributes: ['id', 'question_text']
        },
        {
          model: db.Option,
          as: 'Option',
         attributes: ['id', ['text', 'option_text']]
        }
      ]
    });

    if (!answers || answers.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No answers discovered for this profile execution matrix.',
        test_id: testId,
        questions: {} 
      });
    }

    // Build the payload lookup table safely
    const questionsLookup = {};
    let correctCount = 0;
    
    answers.forEach(ans => {
      const targetQuestion = ans.Question || ans.questions;
      const targetOption = ans.Option;

      if (targetQuestion && targetQuestion.id) {
        const isCorrect = targetOption ? targetOption.is_correct : false;
        if (isCorrect) correctCount++;

        questionsLookup[targetQuestion.id] = {
          answer_id: ans.id,
          // Fallback safely to option_text if text strings aren't present
          selected_option_text: targetOption ? targetOption.option_text : "No option text available",
          is_correct: isCorrect,
          // FIX: Changed targetQuestion.text to targetQuestion.title to match attributes above
          question_text: targetQuestion.title || targetQuestion.content || "Question text missing",
          question_type: targetQuestion.type
        };
      }
    });

    const totalQuestions = answers.length;
    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return res.status(200).json({
      success: true,
      test_id: testId,
      score_percentage: Math.round(scorePercentage),
      total_questions: totalQuestions,
      correct_answers: correctCount,
      questions: questionsLookup
    });

  } catch (error) {
    console.error('CRITICAL BACKEND ERROR:', error);
    return res.status(500).json({ 
      error: 'Internal system array mapping exception.',
      details: error.message 
    });
  }
});
router.get('/user/:userId/test/:testId/answers-matrix', controller.getAnswersMatrix);

module.exports = router;
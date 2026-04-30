const db = require("../models");
const { Op, fn, col, literal } = require("sequelize");

module.exports = {

  // GET /api/dashboard/stats
  // Returns all counts needed for every dashboard role in one call
  async getStats(req, res) {
    try {
      const [
        totalUsers,
        totalOrganizations,
        totalGroups,
        totalTests,
        totalQuestions,
        totalResults,
        totalProgresses,
        totalCategories,
        totalTraits,
        recentResults,
        recentProgresses,
        recentUsers,
      ] = await Promise.all([
        db.User.count(),
        db.Organization.count(),
        db.Group.count(),
        db.Test.count(),
        db.Question.count(),
        db.Result.count(),
        db.Progress.count(),
        db.Category.count(),
        db.Triat.count(),

        // Last 6 results with user + test info
        db.Result.findAll({
          limit: 6,
          order: [["createdAt", "DESC"]],
          include: [
            { model: db.User, as: "User", attributes: ["id", "first_name", "last_name", "email"] },
            { model: db.Test, as: "Test", attributes: ["id", "title"] },
          ],
        }),

        // Last 6 progresses
        db.Progress.findAll({
          limit: 6,
          order: [["createdAt", "DESC"]],
          include: [
            { model: db.User, as: "User", attributes: ["id", "first_name", "last_name"] },
            { model: db.Test, as: "Test", attributes: ["id", "title"] },
          ],
        }),

        // Last 5 registered users
        db.User.findAll({
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: ["id", "first_name", "last_name", "email", "createdAt"],
        }),
      ]);

      // Average score from results
      const avgScoreRow = await db.Result.findOne({
        attributes: [[fn("AVG", col("score")), "avgScore"]],
        raw: true,
      });
      const avgScore = avgScoreRow?.avgScore
        ? Math.round(parseFloat(avgScoreRow.avgScore))
        : 0;

      // Completed progresses (score > 0)
      const completedProgresses = await db.Progress.count({
        where: { score: { [Op.gt]: 0 } },
      });

      res.json({
        counts: {
          users:         totalUsers,
          organizations: totalOrganizations,
          groups:        totalGroups,
          tests:         totalTests,
          questions:     totalQuestions,
          results:       totalResults,
          progresses:    totalProgresses,
          categories:    totalCategories,
          traits:        totalTraits,
          completedProgresses,
          avgScore,
        },
        recentResults,
        recentProgresses,
        recentUsers,
      });
    } catch (e) {
      console.error("Dashboard stats error:", e);
      res.status(500).json({ error: e.message });
    }
  },
};

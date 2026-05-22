const db = require("../models");
const { Op, fn, col, literal } = require("sequelize");

module.exports = {

  // GET /api/dashboard/stats
  // Returns role-based counts for dashboard
  async getStats(req, res) {
    try {
      // Get user info from auth middleware
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = req.user.id;
      console.log('Dashboard request from user:', userId);

      const user = await db.User.findByPk(userId, {
        include: [{
          model: db.Role,
          attributes: ['name']
        }]
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let userRoles = (user.Roles || []).map(r => r.name);
      
      // Fallback: if no roles found via association, query directly
      if (userRoles.length === 0) {
        console.warn('No roles found via association, querying UserRoles table directly');
        const roleRecords = await db.sequelize.query(
          `SELECT r.name FROM Roles r 
           INNER JOIN UserRoles ur ON r.id = ur.roleId 
           WHERE ur.userId = ?`,
          {
            replacements: [userId],
            type: db.sequelize.QueryTypes.SELECT
          }
        );
        userRoles = roleRecords.map(r => r.name);
        console.log('Roles from direct query:', userRoles);
      }

      const isAdmin = userRoles.includes('admin');
      const isOrganization = userRoles.includes('organization');
      const isTester = userRoles.includes('tester');
      const organizationId = user.organization_id;

      console.log('Dashboard access:', { userId, userRoles, organizationId, isAdmin, isOrganization, isTester });

      // Build filters based on role
      let userFilter = {};
      let resultFilter = {};
      let progressFilter = {};
      let testFilter = {};
      let groupFilter = {};

      if (isOrganization && organizationId) {
        console.log('=== ORGANIZATION DASHBOARD ===');
        console.log('Organization ID:', organizationId);
        
        // Organization sees only their own data
        userFilter = { organization_id: organizationId };
        
        // For results/progress, filter by users in their organization
        const orgUserIds = await db.User.findAll({
          where: { organization_id: organizationId },
          attributes: ['id'],
          raw: true
        }).then(users => users.map(u => u.id));
        
        console.log('Organization user IDs:', orgUserIds);
        console.log('Number of users in organization:', orgUserIds.length);
        
        if (orgUserIds.length > 0) {
          resultFilter = { user_id: { [Op.in]: orgUserIds } };
          progressFilter = { user_id: { [Op.in]: orgUserIds } };
          
          // Tests: Find tests assigned to organization users or groups
          const orgGroups = await db.Group.findAll({
            where: { _id: organizationId },
            attributes: ['id'],
            raw: true
          }).then(groups => groups.map(g => g.id));
          
          console.log('Organization group IDs:', orgGroups);
          
          // Get test assignments for org users and groups
          const testAssignments = await db.TestAssignment.findAll({
            where: {
              [Op.or]: [
                { assigned_to_type: 'user', assigned_to_id: { [Op.in]: orgUserIds } },
                { assigned_to_type: 'group', assigned_to_id: { [Op.in]: orgGroups.length > 0 ? orgGroups : [-1] } }
              ]
            },
            attributes: ['test_id'],
            raw: true
          }).then(assignments => [...new Set(assignments.map(a => a.test_id))]);
          
          console.log('Test IDs assigned to organization:', testAssignments);
          
          testFilter = testAssignments.length > 0 
            ? { id: { [Op.in]: testAssignments } }
            : { id: -1 };
            
        } else {
          // No users in organization yet, return empty results
          console.warn('No users found in organization, returning empty results');
          resultFilter = { user_id: -1 }; // Non-existent ID
          progressFilter = { user_id: -1 };
          testFilter = { created_by: -1 };
        }
        
        // Groups filter by organization _id field
        groupFilter = { _id: organizationId };
        
        console.log('Filters:', { userFilter, resultFilter, progressFilter, testFilter, groupFilter });
        console.log('=== END ORGANIZATION DASHBOARD ===');
        
      } else if (isTester && !isAdmin) {
        // Tester sees only their own data
        userFilter = { id: userId };
        resultFilter = { user_id: userId };
        progressFilter = { user_id: userId };
        testFilter = { created_by: userId };
        groupFilter = { created_by: userId };
      }
      // Admin sees everything (no filters)

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
        db.User.count({ where: userFilter }),
        isAdmin ? db.Organization.count() : (isOrganization ? 1 : 0), // Org sees only themselves
        db.Group.count({ where: groupFilter }),
        db.Test.count({ where: testFilter }),
        isAdmin ? db.Question.count() : 0, // Only admin sees all questions
        db.Result.count({ where: resultFilter }),
        db.Progress.count({ where: progressFilter }),
        isAdmin ? db.Category.count() : 0, // Only admin sees categories
        isAdmin ? db.Triat.count() : 0, // Only admin sees traits

        // Last 6 results with user + test info
        db.Result.findAll({
          where: resultFilter,
          limit: 6,
          order: [["createdAt", "DESC"]],
          include: [
            { model: db.User, as: "User", attributes: ["id", "first_name", "last_name", "email"] },
            { model: db.Test, as: "Test", attributes: ["id", "title"] },
          ],
        }),

        // Last 6 progresses
        db.Progress.findAll({
          where: progressFilter,
          limit: 6,
          order: [["createdAt", "DESC"]],
          include: [
            { model: db.User, as: "User", attributes: ["id", "first_name", "last_name"] },
            { model: db.Test, as: "Test", attributes: ["id", "title"] },
          ],
        }),

        // Last 5 registered users
        db.User.findAll({
          where: userFilter,
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: ["id", "first_name", "last_name", "email", "createdAt"],
        }),
      ]);

      // Average score from results (filtered)
      const avgScoreRow = await db.Result.findOne({
        where: resultFilter,
        attributes: [[fn("AVG", col("score")), "avgScore"]],
        raw: true,
      });
      const avgScore = avgScoreRow?.avgScore
        ? Math.round(parseFloat(avgScoreRow.avgScore))
        : 0;

      // Completed progresses (score > 0) - filtered
      const completedProgresses = await db.Progress.count({
        where: { ...progressFilter, score: { [Op.gt]: 0 } },
      });

      res.json({
        role: userRoles[0], // Primary role
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

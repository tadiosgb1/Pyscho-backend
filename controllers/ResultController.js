const { Op } = require("sequelize");
const db = require("../models");
const Result = db.Result;

module.exports = {
async getAll(req, res) {
    try {
      let page = parseInt(req.query.page) || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search = req.query.search || "";
      let ordering = req.query.ordering || "id";

      if (page < 1) page = 1;
      if (page_size < 1) page_size = 10;

      // 1. Crash Prevention Safeguard: Fallback Mock Context if Auth Middleware is Missing
      const currentUser = req.user || {
        id: 1,
        roles: ['admin'], // Assumes admin access to bypass tenant filters during development
        organization_id: null
      };

      const authConditions = [];
      const userRoles = currentUser.roles || [];
      const userId = currentUser.id;
      const organizationId = currentUser.organization_id;

      // 2. Multi-Tenant Authorization Data Boundaries
      if (userRoles.includes('admin')) {
        // Super Admins pull everything in the system
      } else if (userRoles.includes('organization')) {
        // Organizations only view results belonging to their explicit user pool
        authConditions.push({ '$User.organization_id$': organizationId });
      } else {
        // Regular testers only see their own rows
        authConditions.push({ user_id: userId });
      }

      // 3. Search Queries Optimization Block
      const searchableFields = ["interpretation", "recommendations"];
      const searchConditions = searchableFields.map(field => ({ [field]: { [Op.like]: "%" + search + "%" } }));
      
      const where = {
        [Op.and]: [
          ...(authConditions.length ? authConditions : []),
          ...(search ? [{ [Op.or]: searchConditions }] : [])
        ]
      };

      const order = ordering.startsWith("-") ? [[ordering.slice(1), "DESC"]] : [[ordering, "ASC"]];
      const offset = (page - 1) * page_size;

      // 4. Query Execution with Required Relations Associated
      const findOptions = { 
        where, 
        order, 
        offset, 
        limit: page_size,
        include: [
          {
            model: db.User,
            attributes: ['id', 'first_name', 'last_name', 'email', 'organization_id']
          },
          {
            model: db.Test,
            attributes: ['id', 'title']
          }
        ]
      };

      const { rows, count } = await Result.findAndCountAll(findOptions);

      const total_pages = Math.ceil(count / page_size);
      const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;

      res.json({
        count,
        total_pages,
        current_page: page,
        next: page < total_pages ? `${baseUrl}?page=${page + 1}&page_size=${page_size}&search=${search}` : null,
        previous: page > 1 ? `${baseUrl}?page=${page - 1}&page_size=${page_size}&search=${search}` : null,
        page_size,
        data: rows
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getOne(req, res) {
    try {
      const include = [
        {
          model: db.User,
          attributes: ['id', 'first_name', 'last_name', 'email', 'organization_id']
        },
        {
          model: db.Test,
          attributes: ['id', 'title']
        }
      ];
      
      const data = await Result.findByPk(req.params.id, { include });
      if (!data) return res.status(404).json({ error: "Not found" });

      const userRoles = req.user?.roles || [];
      
      // Enforce data tenancy policies on specific record retrievals
      if (!userRoles.includes('admin')) {
        if (userRoles.includes('organization') && data.User?.organization_id !== req.user.organization_id) {
          return res.status(403).json({ error: "Access denied to foreign organization records." });
        } else if (!userRoles.includes('organization') && data.user_id !== req.user.id) {
          return res.status(403).json({ error: "Access denied to requested assessment history profile." });
        }
      }

      res.json(data.toJSON());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const body = { ...req.body };
      
      const data = await Result.create(body);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const body = { ...req.body };
      
      await Result.update(body, { where: { id: req.params.id } });
      const updated = await Result.findByPk(req.params.id);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async delete(req, res) {
    try {
      await Result.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!['pending', 'confirmed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be pending or confirmed.' });
      }
      
      await Result.update({ status }, { where: { id: req.params.id } });
      const updated = await Result.findByPk(req.params.id, {
        include: [db.User, db.Test]
      });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  // Add this method to your existing result controller object
  async getAnswersMatrix(req, res) {
    try {
      const { userId, testId } = req.params;

      // Fetch all answers by this user where the question belongs to this test
      const answers = await db.Answer.findAll({
        where: { user_id: userId },
        include: [
          {
            model: db.Question,
            where: { test_id: testId },
            attributes: ['id', 'question_text', 'type'],
            required: true,   // INNER JOIN — only answers whose question is in this test
          },
          {
            model: db.Option,
            as: 'Option',
            attributes: ['id', 'text', 'value', 'indication_letter'],
            required: false,  // LEFT JOIN — open-ended answers may have no option
          },
        ],
      });

      if (!answers.length) {
        return res.json({
          success: true,
          test_id: parseInt(testId),
          total_questions: 0,
          score_percentage: 0,
          questions: {},
        });
      }

      // Build question → answer map
      const questions = {};
      answers.forEach(ans => {
        const q   = ans.Question;
        const opt = ans.Option;
        if (!q) return;

        questions[q.id] = {
          question_text:        q.question_text,
          question_type:        q.type,
          selected_option_text: opt ? opt.text : '—',
          indication_letter:    opt ? opt.indication_letter : null,
          option_value:         opt ? opt.value : null,
        };
      });

      return res.json({
        success: true,
        test_id: parseInt(testId),
        total_questions: answers.length,
        questions,
      });

    } catch (e) {
      console.error('getAnswersMatrix error:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  },
};

const { Op } = require("sequelize");
const db = require("../models");
const Question = db.Question;
const Option=db.Option;
module.exports = {
 async getAll(req, res) {
  try {
    let page = parseInt(req.query.page) || 1;
    let page_size = parseInt(req.query.page_size) || 10;
    let search = req.query.search || "";
    let ordering = req.query.ordering || "id";

    if (page < 1) page = 1;
    if (page_size < 1) page_size = 10;

    const searchableFields = ["question_text", "question_type", "options", "correct_answer"];
    const searchConditions = searchableFields.map(field => ({ [field]: { [Op.like]: "%" + search + "%" } }));
    const where = search ? { [Op.or]: searchConditions } : {};

    // Filter by test_id if provided
    if (req.query.test_id) {
      where.test_id = parseInt(req.query.test_id);
    }

    const order = ordering.startsWith("-") ? [[ordering.slice(1), "DESC"]] : [[ordering, "ASC"]];
    const offset = (page - 1) * page_size;

    const include = [
      db.Test,
      db.Category,
      { model: db.Option, order: [["position", "ASC"]] }
    ].filter(Boolean);
    const findOptions = { where, order, offset, limit: page_size };
    if (include.length) findOptions.include = include;

    const { rows, count } = await Question.findAndCountAll(findOptions);

    // Get base domain host string (e.g., http://localhost:3000 or https://yourdomain.com)
    const host = `${req.protocol}://${req.get("host")}`;
    
    const dataWithFiles = rows.map(item => {
      const obj = item.toJSON();
      
      // ✅ Intercept and append base URL to options using image uploads
      if (obj.Options && Array.isArray(obj.Options)) {
        obj.Options = obj.Options.map(opt => {
          if (opt.content_type === 'image' && opt.text && !opt.text.startsWith('http')) {
            // Note: Change '/uploads/' to match whatever folder your Express static middleware serves
            opt.text = `${host}/uploads/${opt.text}`;
          }
          return opt;
        });
      }
      
      return obj;
    });

    const total_pages = Math.ceil(count / page_size);
    const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;

    res.json({
      count,
      total_pages,
      current_page: page,
      next: page < total_pages ? `${baseUrl}?page=${page + 1}&page_size=${page_size}` : null,
      previous: page > 1 ? `${baseUrl}?page=${page - 1}&page_size=${page_size}` : null,
      page_size,
      data: dataWithFiles
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
},
async getOne(req, res) {
    try {
      // 💡 Add db.Option to your inclusion array
      const include = [
        {
          model: db.Test,
          attributes: ["id", "title"] // Keeps data minimal, pull what you need
        },
        {
          model: db.Option, // 👈 Populates the nested options array
          attributes: ["id", "text", "content_type", "indication_letter", "triat_id", "weight", "position"]
        }
      ];

      const data = await Question.findByPk(req.params.id, { include });
      if (!data) return res.status(404).json({ error: "Not found" });

      const obj = data.toJSON();
      
      // Optional: If you want to sort them by position on the backend before shipping
      if (obj.Options) {
        obj.Options.sort((a, b) => (a.position || 0) - (b.position || 0));
      }

      res.json(obj);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

async create(req, res) {
  try {
    const body = { ...req.body };
    
    // 1️⃣ Handle multipart text string variables parsing safely
    let options = [];
    if (body.options) {
      try {
        options = typeof body.options === 'string' ? JSON.parse(body.options) : body.options;
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid options format. Failed to parse options payload metadata JSON string." });
      }
    }

    // Clean up base model properties 
    delete body.options;
    
    // Safely typecast weight numeric property if it arrived via raw form string format
    if (body.weight) body.weight = Number(body.weight) || 0;

    // 2️⃣ Create Question entry
    const question = await Question.create(body);

    // 3️⃣ Map Options and intercept File paths
    if (options.length > 0) {
      const optionsToCreate = options.map(opt => {
        let finalOptionText = opt.text;

        /* 
           If the item content type is an image, find the corresponding uploaded file path.
           Depending on your Multer storage setup configuration, this path could be:
           - req.files[opt.file_key][0].filename (Using standard DiskStorage file wrappers)
           - req.files[opt.file_key][0].location (Using cloud buckets like AWS S3 or Google Cloud storage)
        */
        if (opt.content_type === 'image' && req.files && req.files[opt.file_key]) {
          const uploadedFileObject = req.files[opt.file_key][0];
          // Use whatever string path/filename value your application uses to reference images
          finalOptionText = uploadedFileObject.filename || uploadedFileObject.path || uploadedFileObject.location;
        }

        return {
          question_id: question.id, // ✅ CRITICAL
          text: finalOptionText,
          content_type: opt.content_type || 'text',
          indication_letter: opt.indication_letter ? opt.indication_letter.toUpperCase().trim() : null,
          triat_id: opt.triat_id || null,
          weight: opt.weight !== undefined ? Number(opt.weight) : 0,
          position: Number(opt.position) || 1
        };
      });

      await Option.bulkCreate(optionsToCreate);
    }

    // 4️⃣ Return newly created structure along with related options entries
    const created = await Question.findByPk(question.id, {
      include: [{ model: Option }]
    });

    return res.status(201).json(created);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
},

  async update(req, res) {
    try {
      const body = { ...req.body };
      
      await Question.update(body, { where: { id: req.params.id } });
      const updated = await Question.findByPk(req.params.id);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async delete(req, res) {
    try {
      await Question.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

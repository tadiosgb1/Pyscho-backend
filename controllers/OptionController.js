const { Op } = require("sequelize");
const db = require("../models");
const Option = db.Option;

const fs = require("fs");
const path = require("path");

module.exports = {
  async getAll(req, res) {
    try {
      let page = parseInt(req.query.page) || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search = req.query.search || "";
      let ordering = req.query.ordering || "id";

      if (page < 1) page = 1;
      if (page_size < 1) page_size = 10;

      const searchableFields = ["text"];
      const searchConditions = searchableFields.map(field => ({ [field]: { [Op.like]: "%" + search + "%" } }));
      const where = search ? { [Op.or]: searchConditions } : {};
      const order = ordering.startsWith("-") ? [[ordering.slice(1), "DESC"]] : [[ordering, "ASC"]];
      const offset = (page - 1) * page_size;

      const include = [db.Question, db.Triat].filter(Boolean);
      const findOptions = { where, order, offset, limit: page_size };
      if (include.length) findOptions.include = include;

      const { rows, count } = await Option.findAndCountAll(findOptions);

      const host = `${req.protocol}://${req.get("host")}`;
      const dataWithFiles = rows.map(item => {
        const obj = item.toJSON();
        
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
      const include = [db.Question, db.Triat].filter(Boolean);
      const opts = include.length ? { include } : {};
      const data = await Option.findByPk(req.params.id, opts);
      if (!data) return res.status(404).json({ error: "Not found" });

      const obj = data.toJSON();
      const host = `${req.protocol}://${req.get("host")}`;
      
      res.json(obj);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      const body = { ...req.body };
      
      const data = await Option.create(body);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },



  async update(req, res) {
    try {
      const { id } = req.params;
      
      // 1️⃣ Find the existing option profile record
      const option = await Option.findByPk(id);
      if (!option) {
        return res.status(404).json({ error: "Option profile not found" });
      }

      // 2️⃣ Pull out all text fields safely
      const { text, content_type, indication_letter, triat_id, weight, position, existing_image } = req.body;

      let finalOptionSourceText = text;

      // 3️⃣ Core check: Determine what to save based on the file stream presence
      if (content_type === "image") {
        if (req.file) {
          // A new image binary file was uploaded via Multer middleware!
          finalOptionSourceText = req.file.filename;

          // Optional: Delete the old physical file from your local disk space to keep storage tidy
          if (option.content_type === "image" && option.text) {
            const oldFilePath = path.join(__dirname, "../uploads", option.text); // Adjust upload directory target path
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
        } else if (existing_image) {
          // No new file uploaded; retain the existing reference link
          finalOptionSourceText = existing_image;
        }
      }

      // 4️⃣ Execute the record updates safely inside the Database instance
      await option.update({
        text: finalOptionSourceText,
        content_type,
        indication_letter: indication_letter ? indication_letter.toUpperCase().trim() : null,
        triat_id: triat_id || null, // Gracefully fallbacks empty strings to standard SQL Null entries
        weight: Number(weight),
        position: Number(position)
      });

      res.json({ success: true, data: option });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
,

  async delete(req, res) {
    try {
      await Option.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

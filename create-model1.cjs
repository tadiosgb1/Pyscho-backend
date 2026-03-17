/**
 * create-model.cjs
 * Generates:
 *  - Sequelize Model
 *  - Express Controller (CRUD + Pagination Search Ordering)
 *  - Express Route
 *  - Auto-inserts route into server.js safely
 *  - Creates config/config.js if missing
 *  - Creates server.js if missing
 *
 * Usage:
 * node create-model.cjs User users first_name:string last_name:string email:string
 */

const fs = require("fs");
const path = require("path");

// --------------------- CLI Arguments ------------------------
const args = process.argv.slice(2);
const [modelName, tableName, ...fieldArgs] = args;

if (!modelName || !tableName || fieldArgs.length === 0) {
  console.log("Usage: node create-model.cjs User users first_name:string last_name:string email:string");
  process.exit(1);
}

// Capitalize
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Parse fields
const fields = fieldArgs.map(f => {
  const [name, type] = f.split(":");
  return { name, type };
});

// Sequelize type mapping
const typeMap = {
  string: "Sequelize.STRING",
  int: "Sequelize.INTEGER",
  boolean: "Sequelize.BOOLEAN",
  date: "Sequelize.DATE",
  float: "Sequelize.FLOAT",
};

// ------------------ Paths ---------------------
const modelDir = path.join(process.cwd(), "models");
const controllerDir = path.join(process.cwd(), "controllers");
const routeDir = path.join(process.cwd(), "routes");
const configDir = path.join(process.cwd(), "config");
const serverPath = path.join(process.cwd(), "server.js");

[modelDir, controllerDir, routeDir, configDir].forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p);
});

// ------------------ CONFIG ---------------------
const configFile = path.join(configDir, "config.js");
if (!fs.existsSync(configFile)) {
  const configTemplate = `module.exports = {
  development: {
    username: "root",
    password: "",
    database: "project_db",
    host: "127.0.0.1",
    dialect: "mysql",
    logging: false
  }
};
`;
  fs.writeFileSync(configFile, configTemplate);
  console.log("✔ config/config.js created");
} else {
  console.log("⚠ config/config.js already exists, skipping");
}

// ------------------ Sequelize MODEL -------------------------
const modelTemplate = `
module.exports = (sequelize, Sequelize) => {
  const ${cap(modelName)} = sequelize.define("${cap(modelName)}", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    ${fields.map(f =>
      `${f.name}: { type: ${typeMap[f.type] || "Sequelize.STRING"} }`
    ).join(",\n    ")}
  }, {
    tableName: "${tableName}"
  });

  return ${cap(modelName)};
};
`;

fs.writeFileSync(path.join(modelDir, `${cap(modelName)}.js`), modelTemplate);
console.log("✔ Model created");

// ------------------ CONTROLLER WITH PAGINATION ------------------------------
const controllerTemplate = `
const { Op } = require("sequelize");
const db = require("../models");
const ${cap(modelName)} = db.${cap(modelName)};

module.exports = {
  async getAll(req, res) {
    try {
      let page = parseInt(req.query.page) || 1;
      let page_size = parseInt(req.query.page_size) || 10;
      let search = req.query.search || "";
      let ordering = req.query.ordering || "id";

      if (page < 1) page = 1;
      if (page_size < 1) page_size = 10;

      // Build search filter for all string fields
      const searchFields = [
        ${fields
          .filter(f => f.type === "string")
          .map(f => `{ ${f.name}: { [Op.like]: '%' + search + '%' } }`)
          .join(",")}
      ];

      const where = search ? { [Op.or]: searchFields } : {};

      // Ordering
      let order = [];
      if (ordering.startsWith("-")) {
        order.push([ordering.substring(1), "DESC"]);
      } else {
        order.push([ordering, "ASC"]);
      }

      const offset = (page - 1) * page_size;

      const { rows, count } = await ${cap(modelName)}.findAndCountAll({
        where,
        order,
        offset,
        limit: page_size,
      });

      const baseUrl = \`\${req.protocol}://\${req.get("host")}\${req.path}\`;
      const total_pages = Math.ceil(count / page_size);

      const next =
        page < total_pages
          ? \`\${baseUrl}?page=\${page + 1}&page_size=\${page_size}\`
          : null;

      const previous =
        page > 1
          ? \`\${baseUrl}?page=\${page - 1}&page_size=\${page_size}\`
          : null;

      res.json({
        count,
        total_pages,
        current_page: page,
        next,
        previous,
        page_size,
        data: rows,
      });

    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getOne(req, res) {
    try {
      const data = await ${cap(modelName)}.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async create(req, res) {
    try {
      const data = await ${cap(modelName)}.create(req.body);
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async update(req, res) {
    try {
      const data = await ${cap(modelName)}.update(req.body, { where: { id: req.params.id }});
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  async delete(req, res) {
    try {
      await ${cap(modelName)}.destroy({ where: { id: req.params.id }});
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
};
`;

fs.writeFileSync(path.join(controllerDir, `${cap(modelName)}Controller.js`), controllerTemplate);
console.log("✔ Controller created (with pagination, search, ordering)");

// ------------------ ROUTES ------------------------------
const routesTemplate = `
const express = require("express");
const router = express.Router();
const controller = require("../controllers/${cap(modelName)}Controller");

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
`;

const routeFileName = `${modelName.toLowerCase()}Routes.js`;
fs.writeFileSync(path.join(routeDir, routeFileName), routesTemplate);
console.log("✔ Routes created");

// ------------------ SERVER.JS ------------------------------
if (!fs.existsSync(serverPath)) {
  const defaultModelRoute = `${modelName.toLowerCase()}Routes`;
  const serverTemplate = `const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

const db = require("./models");
const ${defaultModelRoute} = require("./routes/${routeFileName}");

app.use(cors());
app.use(express.json());
app.use("/api/${modelName.toLowerCase()}", ${defaultModelRoute});

db.sequelize.sync({ alter: true })
  .then(() => console.log("📦 Database synced"))
  .catch(err => console.error("❌ DB Error:", err));

app.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});
`;
  fs.writeFileSync(serverPath, serverTemplate);
  console.log("✔ server.js created");
} else {
  let serverContent = fs.readFileSync(serverPath, "utf8");
  if (!serverContent.includes(`${modelName.toLowerCase()}Routes`)) {
    const importLine = `const ${modelName.toLowerCase()}Routes = require('./routes/${routeFileName}');\n`;
    serverContent = serverContent.replace(/(^.*require\(.*\);[\r\n]+)/m, `$&${importLine}`);
    const useLine = `app.use("/api/${modelName.toLowerCase()}", ${modelName.toLowerCase()}Routes);\n`;
    serverContent = serverContent.replace(/app.listen/gi, `${useLine}app.listen`);
    fs.writeFileSync(serverPath, serverContent);
    console.log("✔ server.js updated with route");
  } else {
    console.log("⚠ Route already exists in server.js, skipping.");
  }
}

console.log(`🎉 Successfully created backend CRUD for ${modelName}!`);

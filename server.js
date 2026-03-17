require("dotenv").config();
const express = require("express");
const progressRoutes = require('./routes/progressRoutes.js');
const resultRoutes = require('./routes/resultRoutes.js');
const answerRoutes = require('./routes/answerRoutes.js');
const questionRoutes = require('./routes/questionRoutes.js');
const testRoutes = require('./routes/testRoutes.js');
const organizationRoutes = require('./routes/organizationRoutes.js');
const cors = require("cors");
const db = require("./models");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const faqsRoutes = require('./routes/faqsRoutes.js');
const contactRoutes = require('./routes/contactRoutes.js');
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Mount main routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/faqs", faqsRoutes);
const PORT = process.env.PORT || 5000;
// Sync DB and start server
db.sequelize.sync({ alter: true })
  // .sync({ alter: true })
  .then(async () => {
    console.log("Database synced");

    // Start server first
    app.use("/api/organization", organizationRoutes);
app.use("/api/test", testRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/answer", answerRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/progress", progressRoutes);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  })
  .catch(err => console.error("DB Connection Error:", err));

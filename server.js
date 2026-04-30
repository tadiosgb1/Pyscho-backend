require("dotenv").config();
const express = require("express");
const groupRoutes = require('./routes/groupRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const optionRoutes = require('./routes/optionRoutes.js');
const triatRoutes = require('./routes/triatRoutes.js');
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
const userGroupRoutes = require('./routes/userGroupRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const testAssignmentRoutes = require('./routes/testAssignmentRoutes.js');
const planRoutes         = require('./routes/planRoutes.js');
const subscriptionRoutes = require('./routes/subscriptionRoutes.js');
const invoiceRoutes      = require('./routes/invoiceRoutes.js');
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
app.use("/api/user-groups", userGroupRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/test-assignments", testAssignmentRoutes);
app.use("/api/plans",           planRoutes);
app.use("/api/subscriptions",   subscriptionRoutes);
app.use("/api/invoices",        invoiceRoutes);
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
app.use("/api/triat", triatRoutes);
app.use("/api/option", optionRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/group", groupRoutes);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  })
  .catch(err => console.error("DB Connection Error:", err));

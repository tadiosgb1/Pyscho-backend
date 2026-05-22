const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 1️⃣ Force an absolute path to the root 'uploads' folder, or use the ENV override
    const dir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Keeps your timestamp naming pattern intact
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Export the raw multer instance
const upload = multer({ storage });
module.exports = upload;
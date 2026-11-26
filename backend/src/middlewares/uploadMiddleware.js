const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `gear-${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_EXTENSIONS = /^\.(jpeg|jpg|png|webp|gif|svg)$/i;
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);

const fileFilter = (req, file, cb) => {
  const originalName = path.basename(file.originalname || '');
  const ext = path.extname(originalName).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // Block dangerous double extensions (e.g. payload.html.png or script.php.jpg)
  if (/\.(php|html|htm|js|exe|sh|bat|cmd|jsp|asp|aspx)\./i.test(originalName)) {
    return cb(new Error('Invalid file name: disguised executable extensions are not allowed.'), false);
  }

  if (ALLOWED_EXTENSIONS.test(ext) && ALLOWED_MIMES.has(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPEG, PNG, WEBP, GIF, SVG) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

module.exports = { upload };

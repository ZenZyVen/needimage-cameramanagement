const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/upload-signature', authenticate, upload.single('signature'), authController.uploadSignature);
router.post('/upload-avatar', authenticate, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;

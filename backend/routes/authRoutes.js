const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/signup
 * Create new user account
 * Body: { email, password, userType, firstName?, lastName?, companyName? }
 */
router.post('/signup', authController.signup);

/**
 * POST /auth/login
 * Authenticate user and get token
 * Body: { email, password }
 */
router.post('/login', authController.login);

/**
 * POST /auth/verify-email
 * Verify email with token from verification link
 * Body: { token, email }
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * POST /auth/resend-verification-email
 * Resend verification email to user
 * Body: { email }
 */
router.post('/resend-verification-email', authController.resendVerificationEmail);

/**
 * GET /auth/me
 * Get current user profile (protected route)
 * Headers: Authorization: Bearer {token}
 */
router.get('/me', authenticate, authController.getMe);

/**
 * POST /auth/logout
 * Logout user (protected route)
 */
router.post('/logout', authenticate, authController.logout);

/**
 * POST /auth/refresh-token
 * Generate new token (protected route)
 */
router.post('/refresh-token', authenticate, authController.refreshToken);

module.exports = router;

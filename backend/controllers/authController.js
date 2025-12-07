const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Individual = require('../models/Individual');
const Company = require('../models/Company');
const TokenBlacklist = require('../models/TokenBlacklist');
const EmailVerification = require('../models/EmailVerification');
const { sendVerificationEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

/**
 * SIGNUP - Create new user account
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, userType, firstName, lastName, companyName } = req.body;

    // Validation
    if (!email || !password || !userType) {
      return res.status(400).json({ message: 'Email, password, and userType are required' });
    }

    if (!['individual', 'company'].includes(userType)) {
      return res.status(400).json({ message: 'userType must be "individual" or "company"' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email,
      password,
      userType,
      isVerified: false
    });

    await user.save();
    console.log(`[AUTH] User created: ${email} (${userType})`);

    // Create profile based on user type
    if (userType === 'individual') {
      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'firstName and lastName required for individuals' });
      }

      const individual = new Individual({
        userId: user._id,
        firstName,
        lastName
      });
      await individual.save();
      console.log(`[AUTH] Individual profile created for ${user._id}`);
    } else if (userType === 'company') {
      if (!companyName) {
        return res.status(400).json({ message: 'companyName required for companies' });
      }

      const company = new Company({
        userId: user._id,
        companyName
      });
      await company.save();
      console.log(`[AUTH] Company profile created for ${user._id}`);
    }

    // Create email verification record
    const emailVerification = new EmailVerification({
      userId: user._id,
      email: user.email
    });

    const verificationToken = emailVerification.generateToken();
    await emailVerification.save();
    console.log(`[AUTH] Email verification token created for ${email}`);
    console.log(`[AUTH] Token (first 20 chars): ${verificationToken.substring(0, 20)}...`);

    // Send verification email
    try {
      console.log(`[AUTH] About to send verification email to ${email}...`);
      await sendVerificationEmail(email, verificationToken, userType);
      console.log(`[AUTH] ✓ Verification email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('[AUTH] ✗ Failed to send verification email:', emailError.message);
      console.error('[AUTH] Full error:', emailError);
      // Don't fail signup if email fails - user can request resend
    }

    res.status(201).json({
      message: 'Signup successful. Please check your email to verify your account.',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('[AUTH] Signup error:', error);
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

/**
 * LOGIN - Authenticate user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please check your email for verification link.',
        userEmail: email,
        requiresVerification: true
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`[AUTH] User logged in: ${email}`);

    // Generate token
    const token = generateToken(user._id, user.userType);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

/**
 * GET ME - Get current user profile
 */
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    const user = await User.findById(userId);
    
    let profile = null;
    if (userType === 'individual') {
      profile = await Individual.findOne({ userId });
    } else if (userType === 'company') {
      profile = await Company.findOne({ userId });
    }

    res.json({
      user: user.toJSON(),
      profile
    });
  } catch (error) {
    console.error('[AUTH] GetMe error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

/**
 * LOGOUT - Invalidate token by adding to blacklist
 */
exports.logout = async (req, res) => {
  try {
    const token = req.token; // Token extracted from middleware
    const userId = req.user.userId;

    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Decode token to get expiration time
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000); // Convert Unix timestamp to Date

    // Add token to blacklist
    const blacklistedToken = new TokenBlacklist({
      token,
      userId,
      expiresAt,
      reason: 'logout'
    });

    await blacklistedToken.save();
    console.log(`[AUTH] Token blacklisted for user: ${userId}`);

    res.json({ message: 'Logout successful - token revoked' });
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

/**
 * REFRESH TOKEN - Generate new token
 */
exports.refreshToken = (req, res) => {
  try {
    const token = generateToken(req.user.userId, req.user.userType);
    res.json({
      message: 'Token refreshed',
      token
    });
  } catch (error) {
    console.error('[AUTH] RefreshToken error:', error);
    res.status(500).json({ message: 'Failed to refresh token', error: error.message });
  }
};

/**
 * VERIFY EMAIL - Verify email with token
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    console.log(`[AUTH] Verify email request for: ${email}`);
    console.log(`[AUTH] Token (first 20 chars): ${token ? token.substring(0, 20) + '...' : 'MISSING'}`);

    // Validation
    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email are required' });
    }

    // Find email verification record
    console.log(`[AUTH] Searching for verification record for email: ${email.toLowerCase()}`);
    const emailVerification = await EmailVerification.findOne({
      email: email.toLowerCase()
    }).sort({ createdAt: -1 });

    if (!emailVerification) {
      console.log(`[AUTH] ✗ Verification record not found for: ${email}`);
      return res.status(404).json({ message: 'Verification token not found. Please signup again.' });
    }

    console.log(`[AUTH] ✓ Found verification record, checking expiration...`);

    // Check if token is expired
    if (emailVerification.isExpired()) {
      console.log(`[AUTH] ✗ Token expired`);
      return res.status(410).json({ message: 'Verification token has expired. Please request a new one.' });
    }

    console.log(`[AUTH] ✓ Token not expired, checking attempts...`);

    // Check attempt limit
    if (emailVerification.attempts >= 5) {
      console.log(`[AUTH] ✗ Too many attempts (${emailVerification.attempts})`);
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new verification link.' });
    }

    console.log(`[AUTH] ✓ Attempts OK (${emailVerification.attempts}/5), verifying token...`);

    // Verify token
    if (!emailVerification.verifyToken(token)) {
      emailVerification.attempts += 1;
      emailVerification.lastAttemptAt = new Date();
      await emailVerification.save();
      console.log(`[AUTH] ✗ Invalid token (attempts: ${emailVerification.attempts})`);
      return res.status(401).json({ message: 'Invalid verification token' });
    }

    console.log(`[AUTH] ✓ Token verified! Finding user...`);

    // Find user and verify
    const user = await User.findById(emailVerification.userId);
    if (!user) {
      console.log(`[AUTH] ✗ User not found with ID: ${emailVerification.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark email as verified
    user.isVerified = true;
    user.verifiedAt = new Date();
    await user.save();

    // Delete verification record
    await EmailVerification.deleteOne({ _id: emailVerification._id });

    console.log(`[AUTH] ✓ Email verified successfully for: ${email}`);

    res.json({
      message: 'Email verified successfully. You can now login.',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('[AUTH] ✗ VerifyEmail error:', error);
    res.status(500).json({ message: 'Email verification failed', error: error.message });
  }
};

/**
 * RESEND VERIFICATION EMAIL
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Delete old verification records
    await EmailVerification.deleteMany({ userId: user._id });

    // Create new verification record
    const emailVerification = new EmailVerification({
      userId: user._id,
      email: user.email
    });

    const verificationToken = emailVerification.generateToken();
    await emailVerification.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, user.userType);
    } catch (emailError) {
      console.error('[AUTH] Failed to send verification email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    console.log(`[AUTH] Resent verification email to ${email}`);

    res.json({
      message: 'Verification email sent. Please check your inbox.',
      email: email
    });
  } catch (error) {
    console.error('[AUTH] ResendVerificationEmail error:', error);
    res.status(500).json({ message: 'Failed to resend verification email', error: error.message });
  }
};

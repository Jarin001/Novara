const { supabase } = require('../config/supabase');
const { errorHandler } = require('../utils/errorHandler');
const dns = require('dns').promises;

// Password validation function
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation function with MX record checking
const validateEmail = async (email) => {
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Extract domain
  const domain = email.split('@')[1].toLowerCase();

  // Block obviously fake domains
  const invalidDomains = ['example.com', 'test.com', 'localhost'];
  if (invalidDomains.includes(domain)) {
    return { isValid: false, error: 'Please use a real email address' };
  }

  try {
    // Check if domain has MX records (mail servers)
    const mxRecords = await dns.resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      return { isValid: false, error: 'Email domain does not have valid mail servers' };
    }

    return { isValid: true };
  } catch (error) {
    // DNS lookup failed - domain doesn't exist or has no MX records
    return { isValid: false, error: 'Email domain does not exist or cannot receive emails' };
  }
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, name, affiliation } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    // Validate email format and domain
    const emailValidation = await validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ 
        error: emailValidation.error
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Create auth user with email confirmation enabled
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`,
        data: {
          name,
          affiliation: affiliation || null
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ 
          error: 'An account with this email already exists' 
        });
      }
      throw authError;
    }

    // Check if email confirmation is required
    const emailConfirmationRequired = authData.user && !authData.user.email_confirmed_at;

    res.status(201).json({
      message: emailConfirmationRequired 
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed: !!authData.user.email_confirmed_at
      },
      requiresEmailVerification: emailConfirmationRequired
    });
  } catch (error) {
    errorHandler(res, error, 'Registration failed');
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return res.status(403).json({ 
          error: 'Please verify your email before logging in. Check your inbox for the verification link.' 
        });
      }
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }
      throw error;
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: !!data.user.email_confirmed_at
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }
    });
  } catch (error) {
    errorHandler(res, error, 'Login failed');
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`
      }
    });

    if (error) {
      console.error('Resend error:', error);
      
      if (error.message.includes('already confirmed')) {
        return res.status(400).json({
          error: 'This email is already verified. You can log in now.'
        });
      }
      
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Too many requests. Please wait a few minutes before trying again.'
        });
      }

      throw error;
    }

    res.status(200).json({
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    errorHandler(res, error, 'Failed to resend verification email');
  }
};

// Verify email (callback after user clicks link)
const verifyEmail = async (req, res) => {
  try {
    const { token_hash, type, error, error_code, error_description } = req.query;

    // Check if there's an error from Supabase redirect
    if (error) {
      if (error_code === 'otp_expired' || error_description?.includes('expired')) {
        return res.status(400).json({
          error: 'Verification link has expired or has already been used',
          code: 'otp_expired'
        });
      }

      return res.status(400).json({
        error: error_description || 'Verification failed',
        code: error_code
      });
    }

    if (!token_hash || type !== 'email') {
      return res.status(400).json({ 
        error: 'Invalid verification link',
        code: 'invalid_link'
      });
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email'
    });

    if (verifyError) {
      return res.status(400).json({
        error: verifyError.message || 'Verification failed',
        code: 'verification_failed'
      });
    }

    res.status(200).json({
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: true
      }
    });
  } catch (error) {
    errorHandler(res, error, 'Email verification failed');
  }
};

module.exports = {
  register,
  login,
  resendVerificationEmail,
  verifyEmail
};
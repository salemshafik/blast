import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { DatabaseService } from '../services/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const db = DatabaseService.getInstance();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  company: Joi.string().max(100).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
};

// Register new user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { name, email, password, company } = value;

  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const userId = await db.createUser({
    name,
    email,
    password: hashedPassword,
    company: company || '',
    role: 'user',
    isActive: true,
    subscriptionTier: 'free',
    usageQuota: {
      aiGenerations: 10,
      campaigns: 5,
      posts: 20,
    },
  });

  // Generate token
  const token = generateToken(userId);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      token,
      user: {
        id: userId,
        name,
        email,
        company,
        role: 'user',
        subscriptionTier: 'free',
      },
    },
  });
}));

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { email, password } = value;

  // Find user by email
  const user = await db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.',
    });
  }

  // Generate token
  const token = generateToken(user.id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      },
    },
  });
}));

// Get user profile (requires authentication)
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  // This would require auth middleware - placeholder for now
  const userId = (req as any).userId; // Would come from auth middleware

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const user = await db.getUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        usageQuota: user.usageQuota,
      },
    },
  });
}));

export { router as authRoutes };

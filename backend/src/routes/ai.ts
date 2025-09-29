import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { AIService } from '../services/ai';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const aiService = AIService.getInstance();

// Generate content endpoint
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const schema = Joi.object({
    prompt: Joi.string().min(10).max(1000).required(),
    contentType: Joi.string().valid('campaign', 'post', 'email', 'social').required(),
    tone: Joi.string().valid('professional', 'casual', 'enthusiastic', 'friendly').optional(),
    length: Joi.string().valid('short', 'medium', 'long').optional(),
    targetAudience: Joi.string().max(500).optional(),
    keywords: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  try {
    const suggestion = await aiService.generateContent(value);

    res.json({
      success: true,
      data: {
        suggestion,
        prompt: value.prompt,
        contentType: value.contentType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate content. Please try again.',
    });
  }
}));

// Generate multiple variations
router.post('/variations', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const schema = Joi.object({
    prompt: Joi.string().min(10).max(1000).required(),
    contentType: Joi.string().valid('campaign', 'post', 'email', 'social').required(),
    tone: Joi.string().valid('professional', 'casual', 'enthusiastic', 'friendly').optional(),
    length: Joi.string().valid('short', 'medium', 'long').optional(),
    targetAudience: Joi.string().max(500).optional(),
    keywords: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    count: Joi.number().min(2).max(5).default(3),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  try {
    const { count, ...requestData } = value;
    const suggestions = await aiService.generateMultipleVariations(requestData, count);

    res.json({
      success: true,
      data: {
        suggestions,
        totalVariations: suggestions.length,
        prompt: value.prompt,
        contentType: value.contentType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate content variations. Please try again.',
    });
  }
}));

// Improve content
router.post('/improve', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const schema = Joi.object({
    content: Joi.string().min(10).max(2000).required(),
    improvementType: Joi.string().valid('engagement', 'clarity', 'seo', 'tone').required(),
    targetAudience: Joi.string().max(500).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  try {
    const improvement = await aiService.improvContent(
      value.content,
      value.improvementType,
      value.targetAudience
    );

    res.json({
      success: true,
      data: {
        original: value.content,
        improved: improvement,
        improvementType: value.improvementType,
        targetAudience: value.targetAudience,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to improve content. Please try again.',
    });
  }
}));

// Generate hashtags
router.post('/hashtags', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const schema = Joi.object({
    content: Joi.string().min(10).max(2000).required(),
    count: Joi.number().min(1).max(20).default(10),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  try {
    const hashtags = await aiService.generateHashtags(value.content, value.count);

    res.json({
      success: true,
      data: {
        hashtags,
        total: hashtags.length,
        content: value.content,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate hashtags. Please try again.',
    });
  }
}));

// Get AI capabilities and usage info
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  res.json({
    success: true,
    data: {
      capabilities: {
        contentTypes: ['campaign', 'post', 'email', 'social'],
        tones: ['professional', 'casual', 'enthusiastic', 'friendly'],
        lengths: ['short', 'medium', 'long'],
        improvementTypes: ['engagement', 'clarity', 'seo', 'tone'],
        maxVariations: 5,
        maxHashtags: 20,
      },
      limits: {
        promptLength: { min: 10, max: 1000 },
        contentLength: { min: 10, max: 2000 },
        keywordsCount: { max: 20 },
        targetAudienceLength: { max: 500 },
      },
      features: [
        'Content generation with custom prompts',
        'Multiple content variations',
        'Content improvement suggestions',
        'Hashtag generation',
        'Tone adjustment',
        'SEO optimization',
        'Engagement enhancement',
      ],
    },
  });
}));

export { router as aiRoutes };

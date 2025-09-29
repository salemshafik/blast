import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { DatabaseService } from '../services/database';
import { AIService } from '../services/ai';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const db = DatabaseService.getInstance();
const aiService = AIService.getInstance();

// Validation schemas
const postSchema = Joi.object({
  campaignId: Joi.string().required(),
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).max(5000).required(),
  type: Joi.string().valid('social', 'email', 'blog', 'ad').required(),
  platform: Joi.string().valid('facebook', 'instagram', 'twitter', 'linkedin', 'email', 'web').optional(),
  scheduledAt: Joi.date().optional(),
  status: Joi.string().valid('draft', 'scheduled', 'published', 'archived').default('draft'),
  tags: Joi.array().items(Joi.string()).optional(),
  mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  content: Joi.string().min(10).max(5000).optional(),
  type: Joi.string().valid('social', 'email', 'blog', 'ad').optional(),
  platform: Joi.string().valid('facebook', 'instagram', 'twitter', 'linkedin', 'email', 'web').optional(),
  scheduledAt: Joi.date().optional(),
  status: Joi.string().valid('draft', 'scheduled', 'published', 'archived').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
});

// Create new post
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const { error, value } = postSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  // Verify campaign ownership
  const campaign = await db.getCampaignById(value.campaignId);
  if (!campaign || campaign.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Campaign not found or access denied',
    });
  }

  const postId = await db.createPost(userId, {
    ...value,
    metrics: {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      clicks: 0,
    },
    aiGenerated: false,
  });

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: {
      postId,
      post: {
        id: postId,
        ...value,
      },
    },
  });
}));

// Generate post content with AI
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
    keywords: Joi.array().items(Joi.string()).optional(),
    variations: Joi.number().min(1).max(5).default(1),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  try {
    let suggestions;
    
    if (value.variations > 1) {
      suggestions = await aiService.generateMultipleVariations(value, value.variations);
    } else {
      const suggestion = await aiService.generateContent(value);
      suggestions = [suggestion];
    }

    res.json({
      success: true,
      data: {
        suggestions,
        totalVariations: suggestions.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate content. Please try again.',
    });
  }
}));

// Generate hashtags for content
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
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate hashtags. Please try again.',
    });
  }
}));

// Improve existing content
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
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to improve content. Please try again.',
    });
  }
}));

// Get all posts for user
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const posts = await db.getPostsByUserId(userId);

  res.json({
    success: true,
    data: {
      posts,
      total: posts.length,
    },
  });
}));

// Get posts by campaign
router.get('/campaign/:campaignId', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { campaignId } = req.params;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Verify campaign ownership
  const campaign = await db.getCampaignById(campaignId);
  if (!campaign || campaign.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Campaign not found or access denied',
    });
  }

  const posts = await db.getPostsByCampaignId(campaignId);

  res.json({
    success: true,
    data: {
      posts,
      total: posts.length,
      campaignId,
    },
  });
}));

// Get post by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const post = await db.getPostById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  // Check ownership
  if (post.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.json({
    success: true,
    data: {
      post,
    },
  });
}));

// Update post
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const { error, value } = updatePostSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const post = await db.getPostById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  // Check ownership
  if (post.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  await db.updatePost(id, value);

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: {
      post: {
        ...post,
        ...value,
      },
    },
  });
}));

// Delete post
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const post = await db.getPostById(id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  // Check ownership
  if (post.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  await db.deletePost(id);

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
}));

export { router as postRoutes };

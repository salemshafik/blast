import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { DatabaseService } from '../services/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const db = DatabaseService.getInstance();

// Validation schemas
const campaignSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  targetAudience: Joi.string().max(500).optional(),
  keywords: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  goals: Joi.array().items(Joi.string()).optional(),
  budget: Joi.number().min(0).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string().valid('draft', 'active', 'paused', 'completed').default('draft'),
  channels: Joi.array().items(Joi.string().valid('email', 'social', 'web', 'ads')).optional(),
});

const updateCampaignSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  targetAudience: Joi.string().max(500).optional(),
  keywords: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  goals: Joi.array().items(Joi.string()).optional(),
  budget: Joi.number().min(0).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string().valid('draft', 'active', 'paused', 'completed').optional(),
  channels: Joi.array().items(Joi.string().valid('email', 'social', 'web', 'ads')).optional(),
});

// Create new campaign
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId; // Would come from auth middleware
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const { error, value } = campaignSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const campaignId = await db.createCampaign(userId, {
    ...value,
    metrics: {
      views: 0,
      clicks: 0,
      conversions: 0,
      engagement: 0,
    },
    postsCount: 0,
  });

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: {
      campaignId,
      campaign: {
        id: campaignId,
        ...value,
      },
    },
  });
}));

// Get all campaigns for user
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const campaigns = await db.getCampaignsByUserId(userId);

  res.json({
    success: true,
    data: {
      campaigns,
      total: campaigns.length,
    },
  });
}));

// Get campaign by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const campaign = await db.getCampaignById(id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found',
    });
  }

  // Check ownership
  if (campaign.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.json({
    success: true,
    data: {
      campaign,
    },
  });
}));

// Update campaign
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const { error, value } = updateCampaignSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const campaign = await db.getCampaignById(id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found',
    });
  }

  // Check ownership
  if (campaign.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  await db.updateCampaign(id, value);

  res.json({
    success: true,
    message: 'Campaign updated successfully',
    data: {
      campaign: {
        ...campaign,
        ...value,
      },
    },
  });
}));

// Delete campaign
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const campaign = await db.getCampaignById(id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found',
    });
  }

  // Check ownership
  if (campaign.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  await db.deleteCampaign(id);

  res.json({
    success: true,
    message: 'Campaign deleted successfully',
  });
}));

// Get campaign analytics
router.get('/:id/analytics', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const campaign = await db.getCampaignById(id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found',
    });
  }

  // Check ownership
  if (campaign.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Get posts for this campaign
  const posts = await db.getPostsByCampaignId(id);

  const analytics = {
    overview: {
      totalPosts: posts.length,
      totalViews: campaign.metrics?.views || 0,
      totalClicks: campaign.metrics?.clicks || 0,
      totalConversions: campaign.metrics?.conversions || 0,
      engagementRate: campaign.metrics?.engagement || 0,
    },
    performance: {
      ctr: campaign.metrics?.clicks && campaign.metrics?.views 
        ? (campaign.metrics.clicks / campaign.metrics.views * 100).toFixed(2)
        : '0.00',
      conversionRate: campaign.metrics?.conversions && campaign.metrics?.clicks
        ? (campaign.metrics.conversions / campaign.metrics.clicks * 100).toFixed(2)
        : '0.00',
    },
    posts: posts.map(post => ({
      id: post.id,
      title: post.title,
      type: post.type,
      status: post.status,
      createdAt: post.createdAt,
      metrics: post.metrics || {},
    })),
  };

  res.json({
    success: true,
    data: {
      analytics,
    },
  });
}));

export { router as campaignRoutes };

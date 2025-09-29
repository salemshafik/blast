import { VertexAI } from '@google-cloud/vertexai';

export interface GenerateContentRequest {
  prompt: string;
  contentType: 'campaign' | 'post' | 'email' | 'social';
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  targetAudience?: string;
  keywords?: string[];
}

export interface ContentSuggestion {
  content: string;
  title?: string;
  hashtags?: string[];
  confidence: number;
  alternatives?: string[];
}

export class AIService {
  private static instance: AIService;
  private vertexAI: VertexAI;
  private model: any;

  private constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
    });
    
    // Initialize the Gemini model
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generation_config: {
        max_output_tokens: 2048,
        temperature: 0.7,
        top_p: 0.8,
        top_k: 40,
      },
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async generateContent(request: GenerateContentRequest): Promise<ContentSuggestion> {
    try {
      const systemPrompt = this.buildSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);

      const response = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
      });

      const generatedText = response.response.candidates[0].content.parts[0].text;
      
      return this.parseGeneratedContent(generatedText, request);
    } catch (error) {
      console.error('AI content generation failed:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  public async generateMultipleVariations(
    request: GenerateContentRequest,
    count: number = 3
  ): Promise<ContentSuggestion[]> {
    const promises = Array.from({ length: count }, () =>
      this.generateContent({
        ...request,
        prompt: `${request.prompt} (Generate a unique variation)`,
      })
    );

    try {
      const results = await Promise.all(promises);
      return results.map((result, index) => ({
        ...result,
        confidence: result.confidence * (1 - index * 0.1), // Slightly reduce confidence for variations
      }));
    } catch (error) {
      console.error('Failed to generate multiple variations:', error);
      throw new Error('Failed to generate content variations.');
    }
  }

  public async improvContent(
    originalContent: string,
    improvementType: 'engagement' | 'clarity' | 'seo' | 'tone',
    targetAudience?: string
  ): Promise<ContentSuggestion> {
    const improvementPrompts = {
      engagement: 'Make this content more engaging and compelling',
      clarity: 'Improve the clarity and readability of this content',
      seo: 'Optimize this content for search engines while maintaining readability',
      tone: `Adjust the tone of this content to better match the ${targetAudience || 'target audience'}`,
    };

    const prompt = `${improvementPrompts[improvementType]}:\n\n${originalContent}`;

    return this.generateContent({
      prompt,
      contentType: 'post',
      targetAudience,
    });
  }

  public async generateHashtags(content: string, count: number = 10): Promise<string[]> {
    try {
      const prompt = `Generate ${count} relevant and popular hashtags for the following content. Return only the hashtags separated by commas, without the # symbol:\n\n${content}`;

      const response = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });

      const generatedText = response.response.candidates[0].content.parts[0].text;
      const hashtags = generatedText
        .split(',')
        .map((tag: string) => tag.trim().replace('#', ''))
        .filter((tag: string) => tag.length > 0)
        .slice(0, count);

      return hashtags;
    } catch (error) {
      console.error('Hashtag generation failed:', error);
      return [];
    }
  }

  private buildSystemPrompt(request: GenerateContentRequest): string {
    const contentTypeInstructions = {
      campaign: 'You are a marketing campaign strategist. Create comprehensive campaign content that drives engagement and conversions.',
      post: 'You are a social media expert. Create engaging social media posts that capture attention and encourage interaction.',
      email: 'You are an email marketing specialist. Create compelling email content that drives opens, clicks, and conversions.',
      social: 'You are a social media content creator. Create shareable content optimized for social media platforms.',
    };

    const toneInstructions = {
      professional: 'Use a professional, authoritative tone.',
      casual: 'Use a casual, conversational tone.',
      enthusiastic: 'Use an enthusiastic, energetic tone.',
      friendly: 'Use a friendly, approachable tone.',
    };

    let systemPrompt = contentTypeInstructions[request.contentType];

    if (request.tone) {
      systemPrompt += ` ${toneInstructions[request.tone]}`;
    }

    if (request.targetAudience) {
      systemPrompt += ` Target audience: ${request.targetAudience}.`;
    }

    systemPrompt += ' Provide high-quality, original content that is engaging and relevant.';

    return systemPrompt;
  }

  private buildUserPrompt(request: GenerateContentRequest): string {
    let userPrompt = `Create ${request.contentType} content based on: ${request.prompt}`;

    if (request.length) {
      const lengthInstructions = {
        short: 'Keep it concise (1-2 sentences)',
        medium: 'Medium length (2-4 sentences)',
        long: 'Comprehensive length (multiple paragraphs)',
      };
      userPrompt += ` Length: ${lengthInstructions[request.length]}.`;
    }

    if (request.keywords && request.keywords.length > 0) {
      userPrompt += ` Include these keywords naturally: ${request.keywords.join(', ')}.`;
    }

    return userPrompt;
  }

  private parseGeneratedContent(
    generatedText: string,
    request: GenerateContentRequest
  ): ContentSuggestion {
    // Extract title if present (usually first line if it's in title case or has special formatting)
    const lines = generatedText.split('\n').filter(line => line.trim().length > 0);
    let title: string | undefined;
    let content: string;

    if (lines.length > 1 && lines[0].length < 100 && /^[A-Z]/.test(lines[0])) {
      title = lines[0].trim();
      content = lines.slice(1).join('\n').trim();
    } else {
      content = generatedText.trim();
    }

    // Calculate confidence based on content quality metrics
    const confidence = this.calculateConfidence(content, request);

    return {
      content,
      title,
      confidence,
    };
  }

  private calculateConfidence(content: string, request: GenerateContentRequest): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on content length appropriateness
    const wordCount = content.split(' ').length;
    if (request.length === 'short' && wordCount <= 50) confidence += 0.1;
    else if (request.length === 'medium' && wordCount > 50 && wordCount <= 200) confidence += 0.1;
    else if (request.length === 'long' && wordCount > 200) confidence += 0.1;

    // Adjust based on keyword inclusion
    if (request.keywords) {
      const keywordMatches = request.keywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      confidence += (keywordMatches / request.keywords.length) * 0.1;
    }

    return Math.min(confidence, 1.0);
  }
}

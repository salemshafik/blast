import { Firestore } from '@google-cloud/firestore';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Firestore;

  private constructor() {
    this.db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Test the connection
      await this.db.collection('health').doc('test').set({
        timestamp: new Date(),
        status: 'connected',
      });
      console.log('Firestore connection established successfully');
    } catch (error) {
      console.error('Failed to connect to Firestore:', error);
      throw error;
    }
  }

  public getFirestore(): Firestore {
    return this.db;
  }

  // User management
  public async createUser(userData: any): Promise<string> {
    const docRef = await this.db.collection('users').add({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  public async getUserById(id: string): Promise<any> {
    const doc = await this.db.collection('users').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  public async getUserByEmail(email: string): Promise<any> {
    const snapshot = await this.db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Campaign management
  public async createCampaign(userId: string, campaignData: any): Promise<string> {
    const docRef = await this.db.collection('campaigns').add({
      ...campaignData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  public async getCampaignsByUserId(userId: string): Promise<any[]> {
    const snapshot = await this.db
      .collection('campaigns')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  public async getCampaignById(id: string): Promise<any> {
    const doc = await this.db.collection('campaigns').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  public async updateCampaign(id: string, updates: any): Promise<void> {
    await this.db.collection('campaigns').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });
  }

  public async deleteCampaign(id: string): Promise<void> {
    await this.db.collection('campaigns').doc(id).delete();
  }

  // Post management
  public async createPost(userId: string, postData: any): Promise<string> {
    const docRef = await this.db.collection('posts').add({
      ...postData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  public async getPostsByUserId(userId: string): Promise<any[]> {
    const snapshot = await this.db
      .collection('posts')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  public async getPostsByCampaignId(campaignId: string): Promise<any[]> {
    const snapshot = await this.db
      .collection('posts')
      .where('campaignId', '==', campaignId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  public async getPostById(id: string): Promise<any> {
    const doc = await this.db.collection('posts').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  public async updatePost(id: string, updates: any): Promise<void> {
    await this.db.collection('posts').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });
  }

  public async deletePost(id: string): Promise<void> {
    await this.db.collection('posts').doc(id).delete();
  }

  // Template management
  public async createTemplate(userId: string, templateData: any): Promise<string> {
    const docRef = await this.db.collection('templates').add({
      ...templateData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  public async getTemplatesByUserId(userId: string): Promise<any[]> {
    const snapshot = await this.db
      .collection('templates')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  public async getPublicTemplates(): Promise<any[]> {
    const snapshot = await this.db
      .collection('templates')
      .where('isPublic', '==', true)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}

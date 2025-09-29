# Marketing SaaS Application

A comprehensive AI-powered marketing application built for Google Cloud Platform with campaign management and content generation capabilities.

## 🚀 Features

- **Campaign Management**: Create, manage, and track marketing campaigns
- **AI-Powered Content Generation**: Generate marketing content using Google Cloud Vertex AI
- **Multi-Platform Support**: Support for social media, email, and web campaigns
- **Content Templates**: Pre-built templates for various marketing needs
- **Analytics Dashboard**: Track campaign performance and engagement
- **User Authentication**: Secure JWT-based authentication
- **Real-time Suggestions**: AI-powered content improvements and hashtag generation

## 🏗️ Architecture

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: Google Cloud Firestore
- **AI Service**: Google Cloud Vertex AI (Gemini)
- **Authentication**: JWT tokens
- **Package Manager**: pnpm

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios with React Query
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form with Zod validation

### Infrastructure
- **Cloud Platform**: Google Cloud Platform
- **Container Registry**: Google Container Registry
- **Deployment**: Cloud Run
- **Development**: Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**
- **pnpm** (package manager)
- **Docker & Docker Compose**
- **Google Cloud CLI** (`gcloud`)
- **GCP Account** with billing enabled

### Required GCP Services

Enable the following APIs in your GCP project:
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  containerregistry.googleapis.com
```

## 🛠️ Local Development Setup

### 1. Clone and Setup

```bash
git clone <your-repo>
cd marketing-saas
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
JWT_SECRET=your-super-secret-jwt-key
```

Install dependencies:
```bash
pnpm install
```

### 3. Frontend Setup

```bash
cd ../frontend
pnpm install
```

### 4. Google Cloud Service Account

1. Create a service account in GCP Console
2. Grant the following roles:
   - Cloud Firestore Service Agent
   - Vertex AI User
   - Cloud Storage Object Viewer
3. Download the service account key as JSON
4. Place it in the project root as `service-account-key.json`

### 5. Start Development Environment

```bash
# From project root
docker-compose up -d
```

Or run services individually:

```bash
# Backend (port 8080)
cd backend
pnpm run dev

# Frontend (port 3000)
cd frontend
pnpm run dev
```

## 🚀 Deployment

### Using Cloud Build (Recommended)

1. **Setup Cloud Build trigger**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Manual deployment**:
   ```bash
   # Set your project ID
   export PROJECT_ID=your-gcp-project-id
   
   # Deploy backend
   gcloud run deploy marketing-saas-backend \
     --source ./backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   
   # Deploy frontend
   gcloud run deploy marketing-saas-frontend \
     --source ./frontend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Environment Variables for Production

Set these environment variables in Cloud Run:

**Backend**:
- `NODE_ENV=production`
- `GOOGLE_CLOUD_PROJECT_ID=your-project-id`
- `JWT_SECRET=your-production-secret`
- `FRONTEND_URL=https://your-frontend-url`

**Frontend**:
- `VITE_API_URL=https://your-backend-url`
- `VITE_APP_ENV=production`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Campaign Endpoints

- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/analytics` - Campaign analytics

### Post Endpoints

- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/generate` - Generate AI content
- `POST /api/posts/hashtags` - Generate hashtags
- `POST /api/posts/improve` - Improve content

### AI Endpoints

- `POST /api/ai/generate` - Generate content
- `POST /api/ai/variations` - Generate variations
- `POST /api/ai/improve` - Improve content
- `POST /api/ai/hashtags` - Generate hashtags
- `GET /api/ai/info` - AI capabilities info

## 🔧 Configuration

### Backend Configuration (.env)

```env
# Server
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
VERTEX_AI_LOCATION=us-central1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

Environment variables are prefixed with `VITE_`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_ENV=development
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pnpm test
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

### Type Checking
```bash
# Backend
cd backend && pnpm run type-check

# Frontend
cd frontend && pnpm run type-check
```

## 📊 Monitoring & Logging

- **Cloud Logging**: Application logs are automatically collected
- **Cloud Monitoring**: Set up custom metrics and alerts
- **Error Reporting**: Automatic error tracking in production

## 🔐 Security Considerations

- JWT tokens expire in 7 days
- Rate limiting enabled (100 requests per 15 minutes)
- CORS configured for specific origins
- Input validation using Joi/Zod
- SQL injection prevention with parameterized queries
- XSS protection with proper content sanitization

## 🚦 Health Checks

- Backend: `GET /health`
- Frontend: Handled by nginx

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Troubleshooting

### Common Issues

1. **"Cannot connect to Firestore"**
   - Verify service account key is correctly placed
   - Check GCP project ID in environment variables
   - Ensure Firestore API is enabled

2. **"Vertex AI quota exceeded"**
   - Check your GCP quotas and billing
   - Implement

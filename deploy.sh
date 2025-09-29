#!/bin/bash

# Marketing SaaS Deployment Script
set -e

echo "🚀 Marketing SaaS Application Deployment"
echo "========================================"

# Check if required tools are installed
command -v gcloud >/dev/null 2>&1 || { echo "❌ gcloud CLI is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Run: npm install -g pnpm" >&2; exit 1; }

# Get project ID
if [ -z "$PROJECT_ID" ]; then
    echo "📝 Please enter your Google Cloud Project ID:"
    read -r PROJECT_ID
    export PROJECT_ID
fi

echo "🔧 Using Project ID: $PROJECT_ID"

# Set gcloud project
echo "🔧 Setting gcloud project..."
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    firestore.googleapis.com \
    aiplatform.googleapis.com \
    containerregistry.googleapis.com

echo "✅ APIs enabled successfully"

# Check if service account key exists
if [ ! -f "service-account-key.json" ]; then
    echo "⚠️  Service account key not found at: service-account-key.json"
    echo "📝 Please create a service account with the following roles:"
    echo "   - Cloud Firestore Service Agent"
    echo "   - Vertex AI User" 
    echo "   - Cloud Storage Object Viewer"
    echo ""
    echo "📝 Download the key as JSON and save as 'service-account-key.json' in the project root"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Service account key found"

# Build and deploy using Cloud Build
echo "🏗️  Building and deploying application..."
gcloud builds submit --config cloudbuild.yaml --substitutions=_PROJECT_ID="$PROJECT_ID"

# Get the deployed URLs
BACKEND_URL=$(gcloud run services describe marketing-saas-backend --platform managed --region us-central1 --format 'value(status.url)')
FRONTEND_URL=$(gcloud run services describe marketing-saas-frontend --platform managed --region us-central1 --format 'value(status.url)')

echo ""
echo "🎉 Deployment completed successfully!"
echo "========================================"
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL:  $BACKEND_URL"
echo ""
echo "⚡ Next Steps:"
echo "1. Update frontend environment to use the backend URL"
echo "2. Configure custom domain (optional)"
echo "3. Set up monitoring and alerting"
echo "4. Configure CI/CD pipeline"
echo ""
echo "📚 Visit the URLs above to start using your Marketing SaaS application!"

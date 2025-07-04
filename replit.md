# Voice Mate - PWA Development Guide

## Overview

Voice Mate is a Progressive Web App that combines voice diary, task management, and timetable features with intelligent voice-to-text conversion. The application is built as a full-stack TypeScript application using React for the frontend and Express for the backend, with a focus on voice interaction and local storage capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling
- **Voice Integration**: Web Speech API through custom hooks
- **PWA Features**: Service Worker, Web App Manifest, offline capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Development**: Vite for development server and HMR
- **Build**: ESBuild for production bundling
- **Storage**: In-memory storage with planned PostgreSQL integration
- **API**: RESTful API with JSON responses

### Data Storage Solutions
- **Development**: In-memory storage using Maps
- **Production Ready**: Drizzle ORM configured for PostgreSQL
- **Local Storage**: Browser localStorage for offline functionality
- **Database Options**: 
  - Supabase (PostgreSQL) - Recommended for free deployment
  - Neon Database (PostgreSQL) with connection pooling
  - Firebase (requires payment for functions)

## Key Components

### Voice Recognition System
- Custom `useVoiceRecognition` hook wrapping Web Speech API
- Continuous listening with interim results
- Error handling and browser compatibility checks
- Language configuration support

### Data Models
- **Diary Entries**: Date-based content with timestamps
- **Tasks**: Kanban-style with status tracking (not_started, started, progress, completed, halted)
- **Schedule Items**: Time-based with repeat patterns (daily, weekdays, weekends, custom)

### UI Components
- **DiaryCalendar**: Calendar view with entry management
- **KanbanBoard**: Task management with drag-and-drop functionality
- **TimetableManager**: Schedule creation and management
- **VoiceRecorder**: Central voice input component
- **Navigation**: Tab-based navigation between features

### PWA Features
- Service Worker for offline functionality
- Web App Manifest for installability
- Local storage fallback for offline usage
- Push notification support (planned)

## Data Flow

1. **Voice Input**: User speaks into microphone
2. **Speech Recognition**: Web Speech API converts speech to text
3. **Processing**: Text is processed and categorized (diary, task, or schedule)
4. **Storage**: Data is sent to backend API and stored
5. **UI Update**: React Query invalidates cache and updates UI
6. **Offline Sync**: Local storage maintains data during offline periods

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, React DOM
- **State Management**: TanStack React Query
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives, shadcn/ui
- **Styling**: TailwindCSS, class-variance-authority
- **Utilities**: date-fns, clsx, cmdk

### Backend Dependencies
- **Server**: Express.js
- **Database**: Drizzle ORM, @neondatabase/serverless
- **Validation**: Zod schemas
- **Session Management**: connect-pg-simple (configured for PostgreSQL sessions)

### Development Dependencies
- **Build Tools**: Vite, ESBuild, TypeScript
- **Development**: tsx for TypeScript execution
- **Linting**: Built-in TypeScript checking

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- In-memory storage for rapid development
- Replit-specific configuration for cloud development

### Production Build
1. Frontend: Vite builds React app to `dist/public`
2. Backend: ESBuild bundles Express server to `dist/index.js`
3. Static files served by Express in production
4. Database migrations applied via Drizzle Kit

### Database Migration
- Drizzle migrations stored in `./migrations`
- Schema defined in `./shared/schema.ts`
- Push command: `npm run db:push`

### Environment Configuration
- `NODE_ENV` for environment detection
- `DATABASE_URL` for PostgreSQL connection
- Replit-specific development features enabled conditionally

## Capacitor Integration

### Android APK Conversion
- **Configuration**: `capacitor.config.ts` with complete app settings
- **Build Script**: `prepare-android.sh` for automated setup
- **Documentation**: Comprehensive guides for deployment

### Mobile Features
- Native notifications with custom sounds
- Microphone permissions for voice recording
- Offline storage and sync capabilities
- Native splash screen and status bar theming
- Haptic feedback integration

### Required Dependencies
```bash
npm install @capacitor/core @capacitor/android @capacitor/cli
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
npm install @capacitor/local-notifications @capacitor/haptics @capacitor/device
npm install @capacitor/network @capacitor/storage @capacitor/filesystem
```

### Build Commands
- `bash prepare-android.sh` - Automated Android setup
- `npx cap sync android` - Sync web assets with native project
- `npx cap open android` - Open Android Studio for APK building

## Documentation Files

### Core Documentation
- **CAPACITOR_SETUP.md**: Step-by-step Capacitor installation and configuration
- **DEPENDENCIES_DOCUMENTATION.md**: Complete library documentation with functions
- **APP_DEPLOYMENT_GUIDE.md**: PWA and Android deployment instructions

### Key Features Documented
- Voice recognition with 10+ language support
- Custom notification sounds upload and management
- Progressive Web App installation and offline support
- Android permissions and native features integration
- Production build and Google Play Store preparation

## Firebase Deployment

### Complete Firebase Hosting Setup
Voice Mate is fully configured for Firebase deployment with zero functionality loss:

#### **Firebase Configuration Files**
- `firebase.json` - Hosting and Functions configuration
- `functions/index.js` - Express API converted to Firebase Functions
- `functions/package.json` - Functions dependencies
- `deploy-firebase.sh` - Automated deployment script

#### **Deployment Process**
1. **Build Project**: `npm run build` (builds React frontend)
2. **Deploy**: `bash deploy-firebase.sh` (deploys to Firebase)
3. **All Features Preserved**: Voice recognition, task detection, data persistence

#### **Firebase Architecture**
- **Frontend**: Firebase Hosting serves React PWA
- **Backend**: Firebase Functions handle all API routes
- **Storage**: In-memory storage (can upgrade to Firestore)
- **Domain**: Custom Firebase domain with HTTPS

#### **What Works on Firebase**
✅ Voice recognition (client-side Web Speech API)  
✅ Intelligent task/diary detection  
✅ All API endpoints via Firebase Functions  
✅ Progressive Web App features  
✅ Mobile responsiveness  
✅ Real-time data persistence  

## Supabase Migration

### Complete Supabase Integration
Voice Mate now supports Supabase as the recommended database solution:

#### **Why Supabase Over Firebase**
- **No Payment Requirements**: Generous free tier with 50,000 monthly active users
- **Real PostgreSQL Database**: Persistent data storage vs Firebase's in-memory limitation
- **Better Free Features**: Real-time capabilities, database browser, SQL editor
- **No Vendor Lock-in**: Standard PostgreSQL compatible with other platforms

#### **Migration Options**
1. **Railway Deployment**: Free hosting with automated setup via `supabase-railway-deploy.sh`
2. **Render Deployment**: Free Node.js hosting with Supabase database
3. **Replit + Supabase**: Keep current Replit setup, add DATABASE_URL secret
4. **Supabase Edge Functions**: Native Supabase hosting (coming soon)

#### **Migration Files Created**
- `SUPABASE_MIGRATION_GUIDE.md` - Complete migration documentation
- `supabase-setup-instructions.md` - Quick 5-minute setup guide
- `supabase-railway-deploy.sh` - Automated Railway deployment script

#### **What's Preserved**
✅ All voice recognition functionality  
✅ Intelligent task detection and categorization  
✅ Progressive Web App features  
✅ Mobile responsiveness and PWA installation  
✅ All UI components and interactions  
✅ Local storage for offline functionality  

#### **What's Improved**
🚀 Real database persistence (data never disappears)  
🚀 Faster PostgreSQL queries and performance  
🚀 Better scalability for multiple users  
🚀 No payment walls or function limitations  
🚀 Advanced database features and real-time capabilities  

## Recent Improvements (July 4, 2025)

### **Enhanced System Architecture**
- **Error Boundary System**: Comprehensive error handling with graceful fallbacks
- **Performance Monitoring**: Real-time API tracking and memory usage monitoring
- **Database Optimizations**: Query optimization with proper indexing strategies
- **Security Hardening**: Rate limiting, input validation, and security headers

### **New Core Components**
- `client/src/lib/error-boundary.tsx` - React error boundary with recovery options
- `client/src/lib/performance.ts` - Performance tracking and bundle analysis
- `server/query-optimizations.ts` - Optimized database queries with analytics
- `server/security.ts` - Comprehensive security middleware and validation

### **Database Schema**
- PostgreSQL tables successfully created and validated
- User authentication system fully functional
- All CRUD operations working with proper user isolation

### **Development Environment**
- All dependencies installed and configured
- Database connection established and tested
- Development server running on port 5000
- Hot module replacement working correctly

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Added comprehensive settings page with custom notification sounds
- July 01, 2025. Created Capacitor configuration for Android APK conversion
- July 01, 2025. Added complete documentation suite for deployment
- July 01, 2025. Fixed voice recognition continuous toggling issues
- July 01, 2025. Implemented intelligent task keyword detection with auto-categorization
- July 01, 2025. Added complete Firebase hosting configuration with Functions
- July 03, 2025. Created comprehensive Supabase migration with Railway/Render deployment options
- July 04, 2025. Complete Replit migration with enhanced architecture and security
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
# Voice Mate - Dependencies & Libraries Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Dependencies](#core-dependencies)
3. [UI & Styling Libraries](#ui--styling-libraries)
4. [Development Dependencies](#development-dependencies)
5. [PWA & Mobile Features](#pwa--mobile-features)
6. [Database & Storage](#database--storage)
7. [Forms & Validation](#forms--validation)
8. [Icons & Assets](#icons--assets)
9. [Build & Deployment](#build--deployment)
10. [Capacitor Dependencies](#capacitor-dependencies)

---

## Project Overview

**Voice Mate** is a Progressive Web App that combines voice diary, task management, and timetable features with intelligent voice-to-text conversion. Built with React, TypeScript, and Express.js, it provides offline capabilities and can be converted to a mobile app using Capacitor.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: In-memory storage (development) / PostgreSQL (production)
- **PWA**: Service Worker + Web App Manifest
- **Mobile**: Capacitor for Android/iOS conversion

---

## Core Dependencies

### React Ecosystem
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0"
}
```
**Purpose**: Core React library for building the user interface
**Function**: Component-based UI development with TypeScript support

### Backend Framework
```json
{
  "express": "^4.18.2",
  "@types/express": "^4.17.17"
}
```
**Purpose**: Node.js web framework for API development
**Function**: REST API endpoints, middleware, static file serving

### TypeScript Support
```json
{
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0",
  "tsx": "^3.12.0"
}
```
**Purpose**: Type-safe JavaScript development
**Function**: Compile-time type checking, better IDE support, code reliability

---

## UI & Styling Libraries

### TailwindCSS
```json
{
  "tailwindcss": "^3.3.0",
  "autoprefixer": "^10.4.14",
  "postcss": "^8.4.24",
  "@tailwindcss/typography": "^0.5.9",
  "@tailwindcss/vite": "^4.0.0-alpha.4"
}
```
**Purpose**: Utility-first CSS framework
**Function**: 
- Rapid UI development with utility classes
- Responsive design system
- Dark mode support
- Typography enhancements

### shadcn/ui Components
```json
{
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-alert-dialog": "^1.0.4",
  "@radix-ui/react-avatar": "^1.0.3",
  "@radix-ui/react-button": "^0.1.0",
  "@radix-ui/react-card": "^0.1.0",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.4",
  "@radix-ui/react-dropdown-menu": "^2.0.5",
  "@radix-ui/react-form": "^0.0.3",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-popover": "^1.0.6",
  "@radix-ui/react-progress": "^1.0.3",
  "@radix-ui/react-radio-group": "^1.1.3",
  "@radix-ui/react-scroll-area": "^1.0.4",
  "@radix-ui/react-select": "^1.2.2",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slider": "^1.1.2",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-toast": "^1.1.4",
  "@radix-ui/react-tooltip": "^1.0.6"
}
```
**Purpose**: Accessible, unstyled UI primitives
**Function**:
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Customizable styling with TailwindCSS

### Styling Utilities
```json
{
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^1.14.0",
  "tailwindcss-animate": "^1.0.6",
  "tw-animate-css": "^0.1.0"
}
```
**Purpose**: Enhanced className handling and animations
**Function**:
- Conditional className application
- Merge conflicting Tailwind classes
- CSS animations and transitions

---

## Development Dependencies

### Build Tools
```json
{
  "vite": "^4.4.5",
  "@vitejs/plugin-react": "^4.0.3",
  "esbuild": "^0.18.17"
}
```
**Purpose**: Fast development and build tooling
**Function**:
- Hot Module Replacement (HMR)
- TypeScript compilation
- Bundle optimization
- Development server

### Replit Integration
```json
{
  "@replit/vite-plugin-cartographer": "^1.0.0",
  "@replit/vite-plugin-runtime-error-modal": "^1.0.0"
}
```
**Purpose**: Replit cloud development environment integration
**Function**:
- Enhanced debugging in Replit
- Runtime error visualization
- Development workflow optimization

---

## PWA & Mobile Features

### PWA Core
```json
{
  "workbox-webpack-plugin": "^6.6.0"
}
```
**Purpose**: Progressive Web App functionality
**Function**:
- Service Worker generation
- Offline caching strategies
- Background sync
- Push notifications

### Voice Recognition
- **Browser API**: Web Speech API
- **Function**: Real-time voice-to-text conversion
- **Languages**: 10+ supported languages
- **Features**: Continuous listening, interim results

### Notifications
- **Browser API**: Notification API
- **Function**: Local notifications for schedule reminders
- **Features**: Custom sounds, vibration, badge updates

---

## Database & Storage

### Development Storage
```json
{
  "memorystore": "^1.6.7"
}
```
**Purpose**: In-memory data storage for development
**Function**: Fast prototyping without database setup

### Production Database
```json
{
  "drizzle-orm": "^0.28.5",
  "drizzle-kit": "^0.19.13",
  "@neondatabase/serverless": "^0.4.24",
  "drizzle-zod": "^0.5.1"
}
```
**Purpose**: Type-safe database ORM and PostgreSQL connection
**Function**:
- Schema definition and migrations
- Type-safe database queries
- Connection pooling
- Zod schema integration

### Local Storage
- **Browser API**: localStorage
- **Function**: Offline data persistence
- **Features**: Data export/import, settings storage

---

## Forms & Validation

### Form Management
```json
{
  "react-hook-form": "^7.45.2",
  "@hookform/resolvers": "^3.1.1"
}
```
**Purpose**: Efficient form handling with validation
**Function**:
- Minimal re-renders
- Built-in validation
- TypeScript integration

### Validation Schema
```json
{
  "zod": "^3.21.4",
  "zod-validation-error": "^1.3.1"
}
```
**Purpose**: Runtime type validation
**Function**:
- Schema-based validation
- Error message generation
- TypeScript type inference

---

## Icons & Assets

### Icons
```json
{
  "lucide-react": "^0.263.1",
  "react-icons": "^4.10.1"
}
```
**Purpose**: Icon libraries for UI elements
**Function**:
- Consistent icon design
- Tree-shaking support
- Customizable styling

### UI Enhancements
```json
{
  "framer-motion": "^10.16.1",
  "embla-carousel-react": "^8.0.0-rc15"
}
```
**Purpose**: Animations and interactive components
**Function**:
- Smooth transitions
- Gesture support
- Touch-friendly carousels

---

## Build & Deployment

### State Management
```json
{
  "@tanstack/react-query": "^4.32.0"
}
```
**Purpose**: Server state management and caching
**Function**:
- API request caching
- Background refetching
- Optimistic updates
- Error handling

### Routing
```json
{
  "wouter": "^2.11.0"
}
```
**Purpose**: Lightweight client-side routing
**Function**:
- Hash-based routing
- Programmatic navigation
- Route parameters

### Session Management
```json
{
  "express-session": "^1.17.3",
  "connect-pg-simple": "^9.0.1",
  "@types/express-session": "^1.17.7"
}
```
**Purpose**: User session handling
**Function**:
- Session storage in PostgreSQL
- Cookie-based authentication
- Session persistence

---

## Capacitor Dependencies

### Core Capacitor
```json
{
  "@capacitor/core": "^5.0.0",
  "@capacitor/cli": "^5.0.0",
  "@capacitor/android": "^5.0.0"
}
```
**Purpose**: Native mobile app development
**Function**:
- Web-to-native bridge
- Android platform support
- Plugin system

### Essential Plugins
```json
{
  "@capacitor/splash-screen": "^5.0.0",
  "@capacitor/status-bar": "^5.0.0",
  "@capacitor/keyboard": "^5.0.0",
  "@capacitor/haptics": "^5.0.0"
}
```
**Purpose**: Native mobile features
**Function**:
- App launch experience
- Status bar customization
- Keyboard behavior
- Haptic feedback

### Storage & Notifications
```json
{
  "@capacitor/storage": "^1.2.5",
  "@capacitor/local-notifications": "^5.0.0",
  "@capacitor/push-notifications": "^5.0.0"
}
```
**Purpose**: Data persistence and user engagement
**Function**:
- Native storage access
- Local notification scheduling
- Push notification handling

### Device Features
```json
{
  "@capacitor/device": "^5.0.0",
  "@capacitor/network": "^5.0.0",
  "@capacitor/filesystem": "^5.0.0",
  "@capacitor/camera": "^5.0.0"
}
```
**Purpose**: Device information and file access
**Function**:
- Device info retrieval
- Network status monitoring
- File system operations
- Camera integration

---

## Installation Commands

### Initial Setup
```bash
# Install core dependencies
npm install

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Install Capacitor plugins
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
npm install @capacitor/local-notifications @capacitor/push-notifications
npm install @capacitor/haptics @capacitor/device @capacitor/network
npm install @capacitor/storage @capacitor/filesystem @capacitor/camera
```

### Development Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build and sync with Capacitor
npm run build && npx cap sync

# Open Android Studio
npx cap open android
```

---

## File Structure

```
voice-mate/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   └── main.tsx        # App entry point
│   ├── public/             # Static assets
│   └── index.html          # HTML template
├── server/                 # Backend Express app
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage layer
│   └── vite.ts             # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
├── android/                # Capacitor Android project
├── capacitor.config.ts     # Capacitor configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## Performance Considerations

1. **Bundle Size**: All dependencies are optimized with tree-shaking
2. **Caching**: TanStack Query provides intelligent caching
3. **Offline Support**: Service Worker handles offline scenarios
4. **Mobile Performance**: Capacitor optimizes for native performance
5. **Type Safety**: TypeScript prevents runtime errors

---

## Security Features

1. **HTTPS**: Required for PWA and voice recording
2. **CSP**: Content Security Policy headers
3. **CORS**: Cross-origin request handling
4. **Session Security**: Secure cookie configuration
5. **Input Validation**: Zod schema validation on all inputs

---

This documentation provides a comprehensive overview of all dependencies and their functions within the Voice Mate application. Each library serves a specific purpose in creating a robust, accessible, and performant voice-powered productivity app.
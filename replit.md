# Evity - Longevity and Health Platform

## Overview
Evity is a comprehensive longevity and wellness platform providing science-based insights and personalized tools to promote healthier, longer lives. It offers a content-rich experience with interactive health assessments, educational content, and personalized guidance. Key features include a patient portal with a longevity questionnaire, integration with Confluence for dynamic content, and a responsive, accessible design. The platform aims to merge modern web technologies with health and wellness content management, drawing inspiration from leading health tech companies.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (Nov 11, 2025)
- **✅ RESOLVED: Questionnaire persistence bug fixed**: Root cause was data type mismatch - `questionnaire_results.longevity_points` column is VARCHAR but code was sending numeric values, causing silent Zod validation failure. Fixed by converting values to strings before saving: `String(refreshed.longevityPoints)` and `String(refreshed.healthStatus)`. Verified with production data showing 20 questionnaires from 8 users successfully saved with string values ("54", "45", "60", etc.).
- **Improved error logging**: Enhanced try-catch blocks with detailed error logging around `saveQuestionnaireResult` to surface validation failures instead of silent errors.
- **Guard condition refinement**: Updated condition from truthiness check to explicit undefined/null check to handle edge cases with zero values or empty strings.
- **Fixed TypeScript errors in Profile.tsx**: Changed query types from `unknown` to `any` to resolve LSP diagnostics preventing page compilation.
- **Questionnaire results display correctly**: Section scores (all 10 health dimensions) are visible on both results page (`/cuestionario-resultados`) and profile page, with automatic database persistence working reliably.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **UI**: Radix UI, shadcn/ui, Tailwind CSS
- **State Management**: TanStack Query
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Design**: RESTful for content and external services
- **AI Agent Service**: Python Flask microservice for RAG-based QA, using OpenAI embeddings and GPT-4o-mini for empathetic responses.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM (hosted on Neon Database)
- **Caching**: React Query for client-side API response caching

### Design System
- **Palette**: Health-focused (deep teal, soft green, warm whites)
- **Typography**: Inter font family
- **Components**: Accessible, comprehensive UI components
- **Responsiveness**: Mobile-first approach

### Content Management
- **Dynamic Content**: Confluence integration for business and educational content
- **Content Types**: Blog posts, resources, guides
- **Internationalization**: Spanish-language support

### Key Features
- **Public Longevity Mini Score Calculator**: A 6-question assessment providing an immediate lifestyle health snapshot without authentication. Includes age question (18-120 years) with age-based interpretation, plus questions on exercise, diet, BMI, tobacco/alcohol, and sleep/emotional well-being. Calculates a score from 0-100 with dual interpretations: (1) lifestyle score interpretation and (2) age-specific context (<40: prevention focus, 40-59: current risk & reversibility, 60+: functional resilience & biological aging). Features calculation history (stored in localStorage) showing last 10 calculations with Spanish-formatted dates, color-coded scores, and age information.
- **Authenticated Longevity Questionnaire System ("Conócete mejor")**: A comprehensive 29-question assessment in the patient portal, evaluating 10 health dimensions (Actividad física y sedentarismo, Dieta y nutrición, Peso e índice de masa corporal, Tabaquismo, Alcohol, Sueño y descanso, Salud mental, Enfermedades crónicas, Apoyo social y propósito, Cognición y funcionalidad). It calculates personalized longevity scores (0-100) and **individual section scores (0-100) for each of the 10 dimensions**, with health status legends, automatic BMI calculation, and progress tracking. **All completed questionnaires are automatically saved to the database**, allowing administrators to view all user results in the admin panel. **Features questionnaire history/versioning**: when a user accesses the questionnaire page after completing one, they see a summary view of their most recent submission with all answers, completion date, and overall score. **Results page displays both the overall longevity score and detailed scores for each of the 10 health sections** with color-coded progress bars (green: 80-100, yellow: 60-79, orange: <60). They can start a new version by clicking "Hacer cuestionario nuevamente", and their previous results are preserved in the history. **Dedicated history page** at `/historial-cuestionarios` displays all completed questionnaires with expandable details showing section-specific scores, allowing users to track their longevity progress over time with color-coded health status badges.
- **Profile Image Upload**: Authenticated users can upload and change their profile pictures directly from their profile page. The system accepts image files (JPEG, PNG, GIF, WebP) up to 5MB, with client-side and server-side validation. Images are stored as base64 data URLs in the database and displayed throughout the application. The upload interface features a small edit button overlay on the avatar with loading state feedback.
- **Floating AI Chatbot Assistant**: An intelligent floating chatbot that appears as a circular icon button with a robot and sparkles in the bottom-right corner of the screen for authenticated users. The chatbot opens as a popup window with a clean, modern chat interface. It answers health and longevity questions using RAG (Retrieval-Augmented Generation) based on a custom knowledge library (PDF/TXT files). The chatbot uses theme-aware colors (primary, accent, muted tokens) for seamless light/dark mode support and follows shadcn UI guidelines with proper Button variants and built-in interaction states. The component (`FloatingChatBot.tsx`) is globally available in the app for authenticated users.
- **Appointment Scheduling System**: Integrated Calendly widget for authenticated users to book appointments, with pre-filled user data.
- **Admin Questionnaire Results Dashboard**: Administrators can view all completed questionnaires from all users in the admin panel at `/admin`, including user information, completion dates, scores, and health status.

## External Dependencies

### Third-Party Services
- **Confluence**: Content management system
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: For AI agent embeddings (text-embedding-3-small) and chat completions (gpt-4o-mini)
- **Calendly**: For appointment scheduling

### Development Tools
- **Replit**: Development environment
- **Google Fonts**: Inter, Merriweather
- **Lucide React**: Icon library
- **React Hook Form**: Form validation
- **Date-fns**: Date utilities
- **Axios**: HTTP client
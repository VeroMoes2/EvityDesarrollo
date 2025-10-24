# Evity - Longevity and Health Platform

## Overview
Evity is a comprehensive longevity and wellness platform providing science-based insights and personalized tools to promote healthier, longer lives. It offers a content-rich experience with interactive health assessments, educational content, and personalized guidance. Key features include a patient portal with a longevity questionnaire, integration with Confluence for dynamic content, and a responsive, accessible design. The platform aims to merge modern web technologies with health and wellness content management, drawing inspiration from leading health tech companies.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Public Longevity Mini Score Calculator**: A 5-question assessment providing an immediate lifestyle health snapshot without authentication. Calculates a score from 0-100 based on exercise, diet, BMI, tobacco/alcohol, and sleep/emotional well-being.
- **Authenticated Longevity Questionnaire System ("Conócete mejor")**: A comprehensive 29-question assessment in the patient portal, evaluating 10 health dimensions. It calculates personalized longevity scores (0-100) and provides health status legends, with automatic BMI calculation and progress tracking.
- **AI Agent System**: An intelligent AI accessible to authenticated users that answers health and longevity questions using RAG (Retrieval-Augmented Generation) based on a custom knowledge library (PDF/TXT files).
- **Appointment Scheduling System**: Integrated Calendly widget for authenticated users to book appointments, with pre-filled user data.

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
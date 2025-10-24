# Evity - Longevity and Health Platform

## Overview

Evity is a comprehensive longevity and wellness platform designed to help users live longer, healthier lives through science-based insights and personalized tools. The platform combines modern web technologies with health and wellness content management, featuring a clean, trustworthy design inspired by medical/health startups like Headspace, Calm, and Oura.

The application serves as a content-rich platform offering longevity resources, interactive health assessments, educational blog content, and personalized health guidance. It features a patient portal with an 8-question longevity questionnaire that calculates personalized health scores. The platform integrates with Confluence for dynamic content management and features a responsive, accessible design built with React and modern UI components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing with support for dynamic routes (/blog/:slug, /recurso/:slug)
- **UI Framework**: Radix UI components with shadcn/ui design system providing accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens following health/wellness industry standards
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js for REST API endpoints
- **Language**: TypeScript throughout the entire stack for consistency and type safety
- **API Design**: RESTful endpoints with focus on content delivery and external service integration
- **Session Management**: Built-in session handling with user authentication
- **AI Agent Service**: Python Flask microservice for QA agent with RAG (Retrieval-Augmented Generation)
  - Vector search using OpenAI embeddings
  - Automatic document indexing from PDF/TXT files
  - Empathetic health-focused response generation

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Caching Strategy**: React Query for client-side caching of API responses

### Design System
- **Color Palette**: Health-focused with deep teal primary, soft green accents, and warm whites
- **Typography**: Inter font family for clean, medical-grade readability
- **Component Library**: Comprehensive UI components following accessibility standards
- **Responsive Design**: Mobile-first approach with consistent spacing using Tailwind's 4-unit system

### Content Management
- **Dynamic Content**: Integration with Confluence for business content and knowledge management
- **Content Types**: Blog posts, resources, guides, and educational materials
- **Internationalization**: Spanish-language content with potential for multi-language support
- **Content Structure**: Organized by categories (nutrition, exercise, research, fundamentals)

## External Dependencies

### Third-Party Services
- **Confluence Integration**: Full content management system integration for dynamic business content including mission, vision, and educational materials
- **Neon Database**: Serverless PostgreSQL hosting for scalable data storage
- **OpenAI API**: Powers the AI agent with embeddings (text-embedding-3-small) and chat completions (gpt-4o-mini)

### Development Tools
- **Replit Integration**: Development environment with hot reload and deployment capabilities
- **Font Services**: Google Fonts (Inter, Merriweather) for typography
- **Asset Management**: Local asset storage with support for generated images

### UI and Component Libraries
- **Radix UI**: Complete set of accessible, unstyled UI primitives
- **Lucide React**: Icon library for consistent visual elements
- **React Hook Form**: Form validation and management with Zod schema validation
- **Date-fns**: Date manipulation and formatting utilities

### API and Data Management
- **Axios**: HTTP client for external API communications
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **TanStack Query**: Server state management with intelligent caching

The architecture prioritizes performance, accessibility, and maintainability while providing a seamless user experience for longevity and wellness content consumption.

## Longevity Questionnaire System

### Overview
The platform features a comprehensive 8-question health assessment questionnaire titled "Conócete mejor" accessible through the patient portal at `/cuestionario`. The questionnaire evaluates three key health dimensions and provides personalized longevity scores.

### Questionnaire Structure
The questionnaire consists of 8 questions organized in 3 sections:
1. **Actividad física y sedentarismo** (3 questions): Evaluates exercise frequency, session duration, and sedentary behavior
2. **Dieta y nutrición** (3 questions): Assesses fruit/vegetable intake, processed food consumption, and cooking fat choices
3. **Peso e índice de masa corporal** (2 questions): Calculates BMI from weight/height and evaluates weight stability

### Point Calculation System
Each question offers 5 response options with assigned point values:
- **+5 points**: Excellent health behavior
- **+3 points**: Good health behavior
- **0 points**: Neutral health behavior
- **-3 points**: Poor health behavior
- **-5 points**: Very poor health behavior

### Score Calculation Logic
1. **Section Averages**: Points within each section are averaged
   - Section 1 Average = (Q1 + Q2 + Q3) / 3
   - Section 2 Average = (Q4 + Q5 + Q6) / 3
   - Section 3 Average = (Q7_BMI + Q8) / 2

2. **Total Score**: Sum of all three section averages (range: typically 0-15 points)
   - Total = Section 1 Average + Section 2 Average + Section 3 Average

3. **Longevity Points Conversion**: Total score is converted to final longevity points
   - **10-15 points** → **100 longevity points** (Excellent health profile)
   - **5-10 points** → **80 longevity points** (Good health profile)
   - **0-5 points** → **50 longevity points** (Needs improvement)

### BMI Calculation (Question 7)
Automatic BMI calculation: BMI = weight(kg) / [height(m)]²
- BMI 18.5-24.9 (healthy) → +5 points
- BMI 25-26.9 (mild overweight) → +3 points
- BMI 27-29.9 (moderate overweight) → 0 points
- BMI 30-34.9 (obesity grade I) → -3 points
- BMI ≥35 (severe obesity) → -5 points

### Database Schema
- **Table**: `medicalQuestionnaire`
- **Key Fields**: 
  - `answers`: JSON object storing user responses
  - `longevityPoints`: Calculated final score (varchar)
  - `isCompleted`: Completion status
  - `completedAt`: Timestamp of completion

### User Experience
- Progress indicator shows completion percentage
- Ability to pause and resume questionnaire
- Automatic save on each answer
- Results displayed on user profile with visual indicator (Sparkles icon)
- Spanish-language interface throughout

## AI Agent System

### Overview
The platform includes an intelligent AI agent that answers health and longevity questions based on a custom knowledge library. The agent is accessible only to authenticated users through the patient portal.

### Technical Implementation
- **Backend Service**: Python Flask microservice (`python_agent/api_server.py`)
- **AI Logic**: RAG (Retrieval-Augmented Generation) system using OpenAI
- **Document Processing**: Automatic indexing of PDF and TXT files
- **Vector Search**: Cosine similarity with text-embedding-3-small
- **Response Generation**: GPT-4o-mini with empathetic health professional persona

### How to Start the AI Agent Service

The AI agent requires a separate Python service to be running:

```bash
# Navigate to the python_agent directory
cd python_agent

# Start the Flask service
python3 api_server.py

# Or run in background
nohup python3 api_server.py > server.log 2>&1 &

# Verify it's running
curl http://localhost:5001/health
```

### Adding Knowledge Content

1. Place PDF or TXT files in `python_agent/contenidos/`
2. The system automatically detects changes and rebuilds the index
3. Supports both English and Spanish documents (auto-translates to Spanish)

### Architecture Flow

```
User Question (Frontend)
    ↓
Express Endpoint (/api/ai-agent/ask)
    ↓
Python Flask Service (localhost:5001)
    ↓
Document Retrieval (Vector Search)
    ↓
OpenAI GPT-4o-mini (Context + Question)
    ↓
Empathetic Response
```

### Security Features
- Endpoint requires user authentication
- All queries logged in audit system
- API keys stored in Replit Secrets
- Python service only accessible from localhost

For detailed instructions, see `INSTRUCTIONS_AI_AGENT.md`
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
The platform features a comprehensive 29-question health assessment questionnaire titled "Conócete mejor" accessible through the patient portal at `/cuestionario`. The questionnaire evaluates 10 key health dimensions and provides personalized longevity scores with health status legends.

### Questionnaire Structure
The questionnaire consists of 29 questions organized in 10 sections:
1. **Actividad física y sedentarismo** (3 questions): Evaluates exercise frequency, session duration, and sedentary behavior
2. **Dieta y nutrición** (3 questions): Assesses fruit/vegetable intake, processed food consumption, and cooking fat choices
3. **Peso e índice de masa corporal** (2 questions): Calculates BMI from weight/height and evaluates weight stability
4. **Tabaquismo** (3 questions): Assesses smoking history, frequency, and cessation timeline
5. **Alcohol** (3 questions): Evaluates alcohol consumption patterns and binge drinking
6. **Sueño y descanso** (3 questions): Measures sleep quality, duration, and daytime fatigue
7. **Salud mental** (3 questions): Screens for depression, anxiety, and negative thoughts
8. **Enfermedades crónicas** (3 questions): Assesses chronic disease burden and medication use
9. **Apoyo social y propósito** (3 questions): Evaluates social connections and life purpose
10. **Cognición y funcionalidad** (3 questions): Measures cognitive function and daily independence

### Point Calculation System
Each question offers 5 response options with assigned point values:
- **+5 points**: Excellent health behavior
- **+3 points**: Good health behavior
- **0 points**: Neutral health behavior
- **-3 points**: Poor health behavior
- **-5 points**: Very poor health behavior

### Score Calculation Logic
1. **Section Averages**: Points within each section are averaged
   - Example: Section 1 Average = (Q1 + Q2 + Q3) / 3
   - Example: Section 2 Average = (Q4 + Q5 + Q6) / 3
   - All 10 sections calculated the same way

2. **Total Score**: Sum of all 10 section averages (range: -50 to +50 points)
   - Total = Section 1 Avg + Section 2 Avg + ... + Section 10 Avg
   - Maximum possible: 50 points (all best answers)
   - Minimum possible: -50 points (all worst answers)

3. **Longevity Points Display**: Total score multiplied by 2 (range: 0-100)
   - **Display Formula**: longevityPoints = totalPoints × 2
   - This provides a more intuitive 0-100 scale for users

4. **Health Status Legends** (Spanish):
   - **40-50 points** (80-100 displayed) → "excelente longevidad y healthspan; riesgo bajo de mortalidad prematura"
   - **30-39 points** (60-79 displayed) → "riesgo moderado; priorizar hábitos saludables"
   - **0-30 points** (0-59 displayed) → "riesgo alto de envejecimiento acelerado y morbilidad crónica"

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
  - `answers`: JSON object storing user responses (29 questions)
  - `longevityPoints`: Calculated and displayed score (0-100 range, varchar)
  - `healthStatus`: Health status legend text (varchar)
  - `isCompleted`: Completion status ("true" or "false")
  - `completedAt`: Timestamp of completion

### User Experience
- Progress indicator shows completion percentage across 29 questions
- Ability to pause and resume questionnaire at any time
- Automatic save on each answer
- Results displayed on user profile with:
  - Longevity points (0-100 scale)
  - Health status legend in Spanish
  - Visual indicator (Sparkles icon)
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
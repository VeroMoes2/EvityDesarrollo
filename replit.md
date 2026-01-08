# Evity - Longevity and Health Platform

### Overview
Evity is a comprehensive longevity and wellness platform providing science-based insights and personalized tools to promote healthier, longer lives. It offers a content-rich experience with interactive health assessments, educational content, and personalized guidance. The platform aims to merge modern web technologies with health and wellness content management, drawing inspiration from leading health tech companies. Key capabilities include a patient portal with a longevity questionnaire, integration with Confluence for dynamic content, a public longevity mini-score calculator, and AI-powered health summaries and chatbot assistance.

### User Preferences
Preferred communication style: Simple, everyday language.

### System Architecture

#### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **UI**: Radix UI, shadcn/ui, Tailwind CSS
- **State Management**: TanStack Query
- **Build Tool**: Vite

#### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Design**: RESTful for content and external services
- **AI Agent Service**: Python Flask microservice for RAG-based QA, using OpenAI embeddings and GPT-4o-mini for empathetic responses.

#### Data Storage
- **Database**: PostgreSQL with Drizzle ORM (hosted on Neon Database)
- **Caching**: React Query for client-side API response caching

#### Design System
- **Palette**: Health-focused (deep teal, soft green, warm whites)
- **Typography**: Inter font family
- **Components**: Accessible, comprehensive UI components
- **Responsiveness**: Mobile-first approach

#### Content Management
- **Dynamic Content**: Confluence integration for business and educational content
- **Content Types**: Blog posts, resources, guides
- **Internationalization**: Spanish-language support

#### Feature Specifications
- **Longevity Mini Score Calculator**: A 6-question public assessment providing an immediate lifestyle health snapshot. Stores calculation history locally.
- **Authenticated Longevity Questionnaire ("Conócete mejor")**: A comprehensive 29-question assessment evaluating 10 health dimensions, calculating personalized longevity and section scores. All results are saved to the database, with history tracking and versioning, including AI-generated personalized summaries.
- **Profile Management**: Users can upload and manage profile pictures.
- **AI Chatbot Assistant**: A floating chatbot offering RAG-based health and longevity advice with conversation memory and contextual responses.
- **Appointment Scheduling System**: Integrated Calendly widget for booking appointments.
- **Admin Dashboard**: Administrators can view all user questionnaire results.
- **Lab Results Management**: OCR-extracted lab analyte values are stored in the database, with features for viewing individual analyte details (e.g., `/analito/:analyteName`), historical trends, and educational descriptions. OCR uses predefined analyte ranges from configuration file (80+ analytes with normal, moderate risk, and high risk thresholds).
- **Lab Data JSON Export**: Export functionality (`/api/labs/export`) generates JSON files containing patient name, user ID, lab name, biomarkers with values and units for external processing. The OCR also returns an `export_json` field immediately after processing.

### External Dependencies

#### Third-Party Services
- **Confluence**: Content management system
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: For AI agent embeddings (text-embedding-3-small) and chat completions (gpt-4o-mini)
- **Calendly**: For appointment scheduling

#### Development Tools
- **Replit**: Development environment
- **Google Fonts**: Inter, Merriweather
- **Lucide React**: Icon library
- **React Hook Form**: Form validation
- **Date-fns**: Date utilities
- **Axios**: HTTP client
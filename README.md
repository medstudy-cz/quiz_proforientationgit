# Medstudy Quiz - Professional Orientation Platform

A modern, multilingual quiz application designed for professional orientation assessment. Built with Next.js 14 and powered by AI to provide personalized career recommendations for medical studies.

## Features

- **Headless CMS**: Content management with Sanity CMS for easy quiz creation and updates
- **Multiple Quiz Support**: Create unlimited quiz variations with custom prompts and questions
- **Interactive Quiz System**: Engaging question-and-answer flow with progress tracking
- **AI-Powered Analysis**: Integration with Google Gemini AI for intelligent result analysis
- **Multi-language Support**: Available in English, Russian, and Ukrainian
- **Email Results**: Automated email delivery of quiz results via SendGrid
- **CRM Integration**: Bitrix24 integration for lead management
- **Analytics**: Comprehensive tracking with Google Analytics, Facebook Pixel, and TikTok Pixel
- **Modern UI**: Built with NextUI v2 and Tailwind CSS for a responsive, accessible interface
- **Dark Mode Support**: Theme switching with next-themes

## Technologies Used

- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [Sanity CMS](https://www.sanity.io/) - Headless CMS for content management
- [NextUI v2](https://nextui.org/) - Modern UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Google Gemini AI](https://ai.google.dev/) - AI-powered analysis
- [SendGrid](https://sendgrid.com/) - Email delivery service
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization
- [Vercel Analytics](https://vercel.com/analytics) - Performance monitoring

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- [Sanity account](https://www.sanity.io/) and project
- SendGrid account and API key
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quiz_proforientationgit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with required credentials:
```env
# Quiz Source: "local" (files) or "sanity" (CMS)
NEXT_PUBLIC_QUIZ_SOURCE=local

# Sanity CMS Configuration (only if QUIZ_SOURCE=sanity)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=your_sanity_token

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_MODEL=gemini-1.5-flash

# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@medstudy.cz
EMAIL_FROM_NAME="Medstudy.cz | Quiz"
EMAIL_REPLY_TO=sales@medstudy.cz
```

5. Set up Sanity CMS:
   - See [SANITY_GUIDE.md](./SANITY_GUIDE.md) for complete setup instructions and AI prompt configuration
   - Access Sanity Studio at `http://localhost:3000/studio` after running dev server

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Build

Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

The production server runs on port 5050 by default.

## Project Structure

```
.
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   ├── api/               # API routes
│   └── studio/            # Sanity Studio interface
├── components/            # React components
│   └── ui/               # UI components
├── sanity/                # Sanity CMS configuration
│   ├── schemas/          # Content schemas
│   │   ├── quiz.ts      # Main quiz schema (role-based)
│   │   ├── simpleQuestion.ts  # Question schema
│   │   ├── university.ts      # University schema
│   │   └── school.ts          # School schema
│   └── lib/             # Sanity utilities
│       ├── client.ts    # Sanity client
│       ├── queries.ts   # GROQ queries
│       ├── api.ts       # API functions
│       └── types.ts     # TypeScript types
├── services/             # Business logic
│   ├── quizService.ts   # Quiz data service
│   └── sanityAdapter.ts # Sanity to app format adapter
├── integrations/         # Third-party integrations
│   ├── gemini.ts        # Google Gemini AI
│   ├── email.ts         # SendGrid email
│   ├── fbpixel.ts       # Facebook Pixel
│   └── tiktokpixel.ts   # TikTok Pixel
├── locales/             # Translation files
│   ├── en/             # English
│   ├── ru/             # Russian
│   └── ua/             # Ukrainian
├── public/             # Static assets
├── styles/             # Global styles
├── utils/              # Utility functions
├── sanity.config.ts    # Sanity configuration
└── SANITY_GUIDE.md     # Sanity setup and usage guide
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server (port 5050)
- `npm run lint` - Run ESLint

## API Endpoints

- `/api/session-answer` - Save quiz answers
- `/api/sendEmail` - Send quiz results via email
- `/api/report` - Generate analysis report
- `/api/bitrix` - Bitrix CRM integration

## Internationalization

The application supports three languages:
- English (en)
- Russian (ru)
- Ukrainian (ua)

Language detection is automatic based on browser preferences, with manual switching available.

## Integrations

### Sanity CMS
Headless content management system for creating and managing multiple quiz variations. Access the studio at `/studio` to create quizzes, questions, and customize AI prompts without code changes.

### Google Gemini AI
Used for analyzing quiz responses and generating personalized career recommendations.

### SendGrid
Handles email delivery for quiz results and reports.

### Bitrix24
CRM integration for lead capture and management.

### Analytics
- Google Analytics - User behavior tracking
- Facebook Pixel - Conversion tracking
- TikTok Pixel - Marketing analytics
- Vercel Analytics - Performance monitoring

## Environment Variables

See `.env.example` for all available configuration options:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (production/staging) | Yes |
| `SANITY_API_READ_TOKEN` | Sanity API read token | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `SENDGRID_API_KEY` | SendGrid API key | Yes |
| `EMAIL_FROM` | Sender email address | Yes |
| `EMAIL_FROM_NAME` | Sender display name | Yes |
| `EMAIL_REPLY_TO` | Reply-to email address | Yes |

For detailed Sanity CMS setup instructions, see [SANITY_GUIDE.md](./SANITY_GUIDE.md).

## License

Licensed under the [MIT license](./LICENSE).

## Support

For issues or questions, please open an issue in the repository.
# 🛡️ FINOS AI Governance Assessment Tool

A modern web application built with Next.js that evaluates AI systems against the FINOS AI Governance Framework using OpenAI for intelligent analysis.

## 🌐 Live Demo

**[View Live Application](https://your-actual-vercel-url.vercel.app)** 

> Replace with your actual Vercel URL after deployment

## 🚀 Features

- **Interactive Assessment Form**: Step-by-step evaluation of AI systems
- **AI-Powered Analysis**: Uses OpenAI to provide intelligent compliance scoring
- **FINOS Framework Integration**: Based on industry-standard governance framework
- **Risk Assessment**: Evaluates Hallucination, Prompt Injection, and Data Leakage risks
- **Actionable Recommendations**: Provides specific mitigation strategies
- **Report Generation**: Download detailed assessment reports as PDF files
- **Email Integration**: Send reports directly to product managers
- **Modern UI**: Responsive design with Tailwind CSS

## 🏗️ Architecture

```
ai-governance-assessment/
├── apps/web/                 # Next.js application
│   ├── src/
│   │   ├── app/              # App router pages and API routes
│   │   ├── components/       # React components
│   │   └── utils/            # Gap analysis logic
│   └── data/                 # FINOS framework JSON files
└── README.md
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, OpenAI GPT-4o-mini
- **PDF Generation**: jsPDF + html2canvas
- **Email**: Gmail API integration
- **Deployment**: Vercel
- **Framework**: FINOS AI Governance Framework

## 🔧 Local Development

### Prerequisites

- Node.js 18+
- OpenAI API key
- Gmail API credentials (optional, for email features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-governance-assessment.git
   cd ai-governance-assessment/apps/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   GMAIL_ACCESS_TOKEN=your-gmail-access-token (optional)
   GMAIL_REFRESH_TOKEN=your-gmail-refresh-token (optional)
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit `http://localhost:3000`

## 🌐 Deployment

This application is optimized for deployment on Vercel:

### Deploy with Vercel

1. **Fork this repository**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `apps/web` directory as the root
3. **Add Environment Variables**:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GMAIL_ACCESS_TOKEN`: Your Gmail access token (optional)
   - `GMAIL_REFRESH_TOKEN`: Your Gmail refresh token (optional)
4. **Deploy**: Vercel will automatically build and deploy

### Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI analysis | Yes |
| `GMAIL_ACCESS_TOKEN` | Gmail API access token for email features | No |
| `GMAIL_REFRESH_TOKEN` | Gmail API refresh token for email features | No |

## 📊 How It Works

### Assessment Process

1. **General Information**: AI model type, use case, industry, data sensitivity
2. **Risk Assessment Path**:
   - **Standard Assessment**: For first-time users
   - **Gap Analysis**: For users with existing implementations (21-question checklist)
3. **AI Analysis**: OpenAI analyzes against FINOS framework
4. **Results**: Risk scores, compliance assessment, and recommendations
5. **Report Generation**: Professional PDF reports with FINOS references

### Supported Risk Categories

- **AIR-OP-004**: Hallucination and Inaccurate Outputs
- **AIR-SEC-010**: Prompt Injection  
- **AIR-RC-001**: Information Leaked to Hosted Model

## 🎯 Framework Coverage

### External Standards Referenced

- **OWASP LLM Top 10** - LLM Application Security Standard
- **FFIEC Guidelines** - Financial Institution IT Examination
- **EU AI Act** - European AI Regulation Framework
- **NIST AI RMF** - AI Risk Management Framework

## 🔒 Security & Privacy

- Environment variables for sensitive data
- No client-side storage of API keys
- Input validation and sanitization
- Gmail OAuth2 authentication
- FINOS framework compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FINOS** for the AI Governance Framework
- **OpenAI** for AI analysis capabilities
- **Vercel** for hosting and deployment
- **OWASP** for LLM security standards

## 📞 Support

For questions or issues:
- Create an issue in this repository
- Review the FINOS AI Governance Framework documentation
- Check OpenAI API documentation for integration issues

---

**Built for the AI Governance Hackathon** 🏆

This tool demonstrates practical application of industry-standard governance frameworks with modern AI capabilities for intelligent compliance assessment.

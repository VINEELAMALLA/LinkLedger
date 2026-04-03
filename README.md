# Deadline Guard: Multi-Agent Saved-Post Organizer

Hey there! 👋 Welcome to **Deadline Guard** - your personal assistant for turning that chaotic pile of saved social media posts into a beautifully organized, deadline-aware dashboard. If you've ever found yourself drowning in saved LinkedIn posts, Instagram reels, and Facebook links about internships, courses, and learning opportunities, this project is for you.

## 🎯 The Problem We're Solving

Picture this: You're scrolling through LinkedIn and spot an amazing internship opportunity. You save it. Later, you see a course on Instagram that looks perfect for your skill development. Save that too. Fast forward a few weeks, and you've got 100+ saved posts scattered across platforms. The problem? They're impossible to search, categorize, or track deadlines for. You end up missing opportunities or wasting time re-scanning everything.

**Deadline Guard** transforms this chaos into clarity using intelligent AI agents that scrape, analyze, and organize your saved content automatically.

## 🚀 What Makes This Special

- **Multi-Agent AI Pipeline**: Smart scraping + content intelligence + deadline tracking
- **Platform Agnostic**: Works with LinkedIn, Instagram, Facebook, and any web content
- **Deadline Awareness**: Never miss an application deadline again
- **Searchable & Filterable**: Find opportunities by company, topic, or keywords
- **Email Reminders**: Get notified when deadlines are approaching
- **Beautiful UI**: Clean, modern interface built with Next.js and Tailwind

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful icon set
- **Local Storage** - Client-side user session management

### Backend
- **Node.js + Express** - RESTful API server
- **Puppeteer** - Headless browser for web scraping
- **GROQ API** - Content analysis and extraction
- **Nodemailer** - Email notifications via Gmail SMTP
- **Node-cron** - Scheduled deadline checking
- **JSON File Storage** - Simple, file-based data persistence

### Infrastructure
- **Monorepo Setup** - Single workspace with frontend and backend
- **CORS** - Cross-origin resource sharing
- **Environment Configuration** - Secure API key management

## ✨ Features

### Core Functionality
- **Single URL Processing**: Paste any social media or web link
- **Intelligent Extraction**: AI-powered content analysis and summarization
- **Auto-Categorization**: Automatically sorts into Internships, Courses, Theory Concepts, AI Tools, etc.
- **Keyword Tagging**: Smart keyword extraction for better searchability
- **Organization Detection**: Identifies companies, institutions, and platforms
- **Deadline Extraction**: Pulls dates from posts and tracks them
- **Email Notifications**: Configurable reminders for upcoming deadlines

### User Experience
- **Responsive Design**: Works beautifully on desktop and mobile
- **Real-time Search**: Instant filtering by keywords, companies, or topics
- **Category Filtering**: Quick access to specific content types
- **Inline Editing**: Update deadlines directly in the dashboard
- **Manual Email Control**: Send reminders on-demand instead of automated scheduling
- **Progress Indicators**: Clear feedback during processing

## 🏁 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**
- **Gmail Account** (for email notifications)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd jhtuh-workspace
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
npm install --workspaces
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your details:

```bash
cd Scrapper-Agent
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:3001

# Get your Groq API key from https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192

# Email configuration (Gmail with app password recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Optional: Custom Chrome path if Puppeteer has issues
# CHROME_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe
```

### 4. Start the Application

#### Option A: Start Both Services Together (Recommended)
```bash
npm run dev
```

#### Option B: Start Services Separately
```bash
# Terminal 1: Start the backend
npm run dev:backend

# Terminal 2: Start the frontend
npm run dev:frontend
```

### 5. Open Your Browser

Navigate to `http://localhost:3001` and start organizing your saved posts!

## 📖 How to Use

1. **Enter Your Email**: Add your email address for deadline reminders
2. **Paste a Link**: Copy any social media post URL (LinkedIn, Instagram, Facebook, etc.)
3. **Watch the Magic**: Our AI agents will scrape, analyze, and categorize the content
4. **Explore Your Dashboard**: Filter by category, search by keywords, or browse opportunities
5. **Set Deadlines**: Click on any item to edit its deadline inline
6. **Get Reminders**: Use the "Send Deadline Emails Now" button for instant notifications

## 🔧 API Endpoints

The backend provides these RESTful endpoints:

### Content Processing
- `POST /api/scrape/single` - Process a single URL
- `POST /api/scrape/batch` - Process multiple URLs

### Data Management
- `GET /api/items` - Retrieve all items (with optional email filtering)
- `PUT /api/items/:id/deadline` - Update item deadline
- `DELETE /api/items/:id` - Remove an item

### Notifications
- `POST /api/notifications/send` - Send deadline reminder emails

### Search & Filter
- `GET /api/items/search` - Search items with query parameters

## 🧪 Testing

The project includes comprehensive test files for different platforms:

```bash
# Test LinkedIn scraping
node test-linkedin-scraper.js

# Test Instagram extraction
node test-instagram-fix.js

# Test deadline functionality
node tmp-deadline-test.js

# Run API improvements test
node test-api-improvements.js
```

## 🤝 Contributing

We'd love your help! Here's how to contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 Project Structure

```
jhtuh-workspace/
├── frontend-app/           # Next.js frontend application
│   ├── app/               # App Router pages and API routes
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions
│   └── public/           # Static assets
├── Scrapper-Agent/        # Node.js backend
│   ├── controllers/      # Request handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic (scraping, AI, email)
│   ├── data/             # JSON storage files
│   └── utils/            # Helper utilities
└── package.json          # Workspace configuration
```

## 🔒 Security Notes

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use `.env` files for sensitive configuration
- **Gmail App Passwords**: Use app-specific passwords instead of your main password
- **Rate Limiting**: Consider implementing rate limiting for production use

## 🐛 Troubleshooting

### Common Issues

**Puppeteer fails to launch Chrome:**
```bash
# Install Chrome dependencies (Linux)
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libp2p0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

# Or specify Chrome path in .env
CHROME_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe
```

**Email notifications not working:**
- Verify Gmail app password is correct
- Check SMTP settings in `.env`
- Ensure "Less secure app access" is enabled (or use app passwords)

**AI extraction not working:**
- Verify Groq API key is valid
- Check API quota and billing status
- Ensure internet connectivity

## 📄 License

This project is licensed under the ISC License - see the package.json files for details.

## 🙏 Acknowledgments

- **Groq** for powerful content analysis
- **Puppeteer** for reliable web scraping
- **Next.js** for the amazing React framework
- **Tailwind CSS** for beautiful styling
- **Radix UI** for accessible components

---

**Built with ❤️ for students and early professionals who deserve better organization tools.**

Have questions? Found a bug? Want to contribute? Open an issue or reach out!

Happy organizing! 🎉
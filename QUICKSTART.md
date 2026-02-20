# Quick Start Guide - AI Code Mentor

This is a simplified quick-start guide. For complete documentation, see [README.md](README.md).

## Prerequisites

- Node.js v18+ installed
- VS Code installed
- OpenAI API key

## Setup (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (Windows)
copy .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_key_here

# Start server
npm start
```

✅ Server should be running on http://localhost:3000

### 2. Extension Setup

Open a **new terminal**:

```bash
# Navigate to extension
cd extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Open in VS Code
code .
```

In VS Code, press **F5** to launch the Extension Development Host.

### 3. Test It

In the Extension Development Host window:

1. Open `sample-test.js` from the project root
2. Right-click in the editor
3. Select **"Review Code with AI"**
4. Wait 5-20 seconds for results
5. View the analysis in the sidebar panel

## That's It! 🎉

You're ready to use AI Code Mentor on any file.

## Common Commands

**Backend**:
- Start server: `npm start`
- Stop server: `Ctrl+C`

**Extension**:
- Compile once: `npm run compile`
- Watch mode: `npm run watch`
- Launch debugger: `F5` in VS Code
- Reload extension: `Ctrl+R` in Development Host

## Need Help?

See the full [README.md](README.md) for:
- Detailed troubleshooting
- Configuration options
- API documentation
- Development guide

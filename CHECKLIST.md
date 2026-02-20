# AI Code Mentor - Setup Checklist

Use this checklist to ensure everything is properly configured.

## ✅ Pre-Installation Checklist

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] VS Code installed (v1.85.0+)
- [ ] OpenAI API key obtained from https://platform.openai.com/api-keys

## ✅ Backend Setup Checklist

- [ ] Navigated to `backend/` folder
- [ ] Ran `npm install` successfully
- [ ] Created `.env` file from `.env.example`
- [ ] Added `OPENAI_API_KEY` to `.env`
- [ ] Started server with `npm start`
- [ ] Server shows: "✅ OpenAI API key configured"
- [ ] Server running on http://localhost:3000
- [ ] Health check accessible: http://localhost:3000/health

## ✅ Extension Setup Checklist

- [ ] Navigated to `extension/` folder
- [ ] Ran `npm install` successfully
- [ ] Ran `npm run compile` successfully
- [ ] No TypeScript compilation errors
- [ ] Opened extension folder in VS Code (`code .`)
- [ ] Pressed F5 to launch Extension Development Host
- [ ] New VS Code window opened (Development Host)

## ✅ Testing Checklist

- [ ] Opened `sample-test.js` in Development Host
- [ ] Right-clicked in editor
- [ ] "Review Code with AI" command visible
- [ ] Clicked "Review Code with AI"
- [ ] Progress notification appeared
- [ ] Analysis completed (5-20 seconds)
- [ ] Webview panel opened on the right
- [ ] Results displayed with all sections:
  - [ ] Summary
  - [ ] Rating (1-10)
  - [ ] Bugs Detected
  - [ ] Security Issues
  - [ ] Improvement Suggestions
  - [ ] Teaching Tips
  - [ ] Refactored Code
- [ ] Copy button works on refactored code

## ✅ Verification Checklist

### Backend Verification
- [ ] Terminal shows no errors
- [ ] Can access http://localhost:3000/health in browser
- [ ] API key is valid (no authentication errors)

### Extension Verification
- [ ] Command appears in Command Palette (Ctrl+Shift+P)
- [ ] Command appears in right-click context menu
- [ ] Extension console shows no errors (Help > Toggle Developer Tools)
- [ ] Can analyze multiple files sequentially
- [ ] Webview updates with new results

## 🐛 If Something Doesn't Work

| Issue | Check | Solution |
|-------|-------|----------|
| Backend won't start | Port 3000 in use | Kill process or change port in .env |
| API key error | .env file | Verify OPENAI_API_KEY is correct |
| Extension not loading | Compilation errors | Run `npm run compile` again |
| Cannot connect | Backend not running | Start backend with `npm start` |
| Timeout errors | Slow response | Increase timeout in VS Code settings |

## 📊 Expected Results on Sample File

When analyzing `sample-test.js`, you should see:

- **Rating**: ~3-5/10 (intentionally bad code)
- **Bugs**: 2-3 detected (null reference, off-by-one error)
- **Security**: 1+ issues (SQL injection)
- **Improvements**: 4-5 suggestions
- **Teaching Tips**: 3-5 educational insights

## 🎉 Success Indicators

✅ **You're successful if:**
1. Backend starts without errors
2. Extension loads in Development Host
3. Analysis completes on sample file
4. Webview displays formatted results
5. Copy button works
6. Can analyze your own code files

## 📝 Next Steps After Success

1. Test with your own code files
2. Adjust settings in VS Code (backend URL, timeout)
3. Experiment with different programming languages
4. Review the refactored code suggestions
5. Learn from the teaching tips

## 🛠️ Advanced: Package Extension

Once everything works, package the extension for distribution:

```bash
cd extension
npm install -g @vscode/vsce
vsce package
```

This creates a `.vsix` file you can install in any VS Code instance.

---

**Need help?** See [README.md](README.md) for detailed troubleshooting.

# 🤝 Handoff.ai

**Handoff.ai** helps engineers hand off their AI-assisted development work to each other by generating:

1. **Human-readable README.md summaries** 
2. **Cursor-style replay logs**

Based on chat exports (from Cursor, Claude) and final code.

---

## ⚙️ Tech Stack

- **Next.js** (TypeScript) - Full-stack React framework
- **TailwindCSS** - Modern CSS framework for beautiful UI
- **NVIDIA NIM** - Powered by `nvidia/llama-3.1-nemotron-nano-8b-v1` model
- **API Route** - `/api/summary` endpoint for processing

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure NVIDIA API Key

Create a `.env.local` file in the root directory:

```bash
# .env.local
NVIDIA_API_KEY=your_nvidia_api_key_here
```

**Get your API key:**
1. Visit [NVIDIA Build](https://build.nvidia.com/)
2. Sign up/login and get your API key
3. Replace `your_nvidia_api_key_here` with your actual key

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How to Use

### Frontend Flow:
1. **Paste Chat Export**: Copy your Cursor/Claude chat log (markdown format) into the first textarea
2. **Paste Final Code**: Add your final working code into the second textarea  
3. **Generate Summary**: Click "Generate Handoff Summary" button
4. **Copy Results**: Use the copy buttons to grab the README.md and Cursor Log

### API Usage:
Send a POST request to `/api/summary`:

```typescript
// Request
{
  markdown: string,  // Chat export content
  code: string       // Final code
}

// Response  
{
  readme: string,    // Generated README.md
  cursorLog: string  // Reconstructed Cursor log
}
```

---

## 🤖 What It Generates

### README.md Summary
- **What they built** - Overview of the feature/functionality
- **Key decisions** - Important architectural choices made
- **Tradeoffs** - Compromises and alternatives considered  
- **Tools used** - AI assistants and frameworks leveraged
- **TODOs** - Outstanding tasks and improvements needed
- **Red flags** - Potential issues or areas needing attention

### Cursor Log Reconstruction  
Recreates the development session in a readable format:
```
### Engineer:
I need to build a React component for user authentication...

### AI:
I'll help you create a secure authentication component. Here's how we can approach this...
```

---

## 🛠 Development

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 🔒 Security Notes

- Your `.env.local` file is automatically ignored by git
- API keys are only used server-side and never exposed to clients
- All requests to NVIDIA NIM are made from the backend API route

---

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for the engineering community**

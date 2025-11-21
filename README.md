# ✨ NebulaKit

> A cosmic-grade SvelteKit starter template powered by Cloudflare's full stack

[![Built with SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00?style=flat&logo=svelte)](https://kit.svelte.dev/)
[![Powered by Cloudflare](https://img.shields.io/badge/Powered%20by-Cloudflare-F38020?style=flat&logo=cloudflare)](https://www.cloudflare.com/)

NebulaKit is a production-ready SvelteKit template with everything you need to build modern web applications. It comes with Cloudflare Workers integration (D1, KV, R2, Queues, Turnstile), a complete theme system, command palette, LLM chat UI, full authentication, and polished drag-and-drop—all built in from day one.

## 🌟 Features

- **🚀 Cloudflare Full Stack**: D1 database, KV storage, R2 buckets, Queues, and Turnstile built-in
- **🎨 Theme System**: Light/dark modes with extensible CSS variables
- **⌨️ Command Palette**: Keyboard-first navigation (Cmd/Ctrl + K)
- **💬 LLM Chat UI**: Ready-to-use chat interface for AI integration
- **🔐 Full Authentication**: Email/password + SSO (Google, GitHub) with account linking
- **📱 Mobile-First**: Responsive layouts optimized for all devices
- **🎯 Drag & Drop**: Polished DnD with cross-column and mobile support
- **⚡ TypeScript**: Full type safety with Cloudflare Workers types
- **🎨 UI Components**: Beautiful, accessible components out of the box

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

Visit `http://localhost:5173` to see your app!

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Complete installation and configuration instructions
- [Features](./FEATURES.md) - Detailed feature documentation and usage examples

## 🏗️ Project Structure

```
NebulaKit/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Svelte stores (theme, etc.)
│   │   ├── server/         # Server-side utilities
│   │   └── utils/          # Helper functions
│   ├── routes/             # SvelteKit routes
│   │   ├── auth/          # Authentication pages
│   │   ├── chat/          # LLM chat interface
│   │   └── demo/          # Feature demonstrations
│   ├── app.css            # Global styles & theme
│   └── app.html           # HTML template
├── static/                 # Static assets
└── wrangler.toml          # Cloudflare configuration
```

## 🎨 Theming

NebulaKit includes a complete theme system with light and dark modes:

```css
/* Customize colors */
:root {
  --color-primary: #0066cc;
  --color-secondary: #6366f1;
  /* ... */
}

/* Add custom themes */
[data-theme='custom'] {
  --color-primary: #your-color;
}
```

The theme switcher automatically detects system preferences and persists user choices.

## 🔐 Authentication

Built-in auth pages with support for:
- Email/password authentication
- OAuth providers (Google, GitHub)
- Session management
- Account linking

Easily extend with [@auth/sveltekit](https://authjs.dev/) for more providers.

## 💬 Chat UI

The included chat interface is ready to connect to your LLM API:

```typescript
// In /routes/chat/+page.svelte
async function sendMessage() {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: input })
  });
  // Handle response
}
```

## ☁️ Cloudflare Integration

### D1 Database
```typescript
const result = await platform.env.DB.prepare(
  'SELECT * FROM users WHERE email = ?'
).bind(email).first();
```

### KV Storage
```typescript
await platform.env.KV.put('key', 'value');
const value = await platform.env.KV.get('key');
```

### R2 Storage
```typescript
await platform.env.BUCKET.put('file.jpg', fileData);
const file = await platform.env.BUCKET.get('file.jpg');
```

### Queues
```typescript
await platform.env.QUEUE.send({ data: 'message' });
```

## 🎯 Drag & Drop

The demo page includes a fully functional kanban board with:
- Desktop drag and drop
- Mobile touch support
- Cross-column dragging
- Smooth animations

## 📱 Mobile Support

NebulaKit is mobile-first with:
- Responsive breakpoints (640px, 768px, 1024px, 1280px)
- Touch-optimized interactions
- Mobile navigation menu
- Optimized bundle sizes

## 🛠️ Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge runtime
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool

## 📝 License

MIT License - feel free to use this template for any project!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## ⭐ Show Your Support

If you find NebulaKit useful, please consider giving it a star on GitHub!

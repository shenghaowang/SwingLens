# 🔭 SwingLens

> A swing trading technical analysis web app — built entirely through natural language prompts using [Claude Code](https://claude.ai/code) by Anthropic.

[![Deploy to GitHub Pages](https://github.com/shenghaowang/SwingLens/actions/workflows/deploy.yml/badge.svg)](https://github.com/shenghaowang/SwingLens/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live app:** https://shenghaowang.github.io/SwingLens/

---

## ✨ Features

### 📊 Watchlist
- Themed stock groups: **Hyperscalers, AI & Semiconductors, Big Tech, Moonshots, Financials, Value & Dividend, Defensive, ETFs & Indices**
- Real-time BUY / SELL / NEUTRAL signal badges per stock
- Filter watchlist by signal type
- Configurable stock list via `public/stocks.txt` — no code changes required

### 📈 Chart View
- **Candlestick price chart** with up to 5 years of daily data (Yahoo Finance)
- **Volume bar chart** — colour-coded green (up day) / red (down day)
- **Volume Profile** overlay — horizontal histogram on the price chart showing volume distribution by price level, with **Point of Control (POC)** highlighted
- **Moving averages**: MA5, MA10, MA20, MA30, MA60, MA120, MA250 — individually toggleable
- **MACD panel** (12, 26, 9) — line, signal line, histogram
- **RSI panel** (14) — with overbought (70) / oversold (30) reference lines
- **BUY / SELL signal markers** overlaid on the price chart (historical crossovers)

### 🎯 Signal Detection
Current signal (as of latest trading day):
- **BUY** — MACD line above signal line AND RSI < 40
- **SELL** — MACD line below signal line AND RSI > 60
- **NEUTRAL** — no clear confluence

### 🔍 Interaction
- **Time range selector**: 1M · 3M · 6M · 1Y · 3Y · 5Y
- All charts (price, volume, MACD, RSI) **sync on zoom and pan**
- Y-axis **auto-scales** to fit visible data including all MA lines
- Descriptive error messages for invalid or delisted tickers

### 🚀 Deployment
- Hosted on **GitHub Pages** — free, zero maintenance
- Auto-deploys on every push to `master` via **GitHub Actions**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev) + [Vite](https://vitejs.dev) |
| Charts | [TradingView Lightweight Charts v4](https://github.com/tradingview/lightweight-charts) |
| Technical Indicators | [technicalindicators](https://github.com/anandanand84/technicalindicators) |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |
| Data | [Yahoo Finance](https://finance.yahoo.com) (via [corsproxy.io](https://corsproxy.io)) |
| Deployment | [GitHub Pages](https://pages.github.com) + [GitHub Actions](https://github.com/features/actions) |

All dependencies are **free and open source**. Total hosting cost: **$0**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Local Development

```bash
# Clone the repo
git clone https://github.com/shenghaowang/SwingLens.git
cd SwingLens

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173/SwingLens/ in your browser.

### Build for Production

```bash
npm run build
# Output in dist/
```

### Deploy

Push to `master` — GitHub Actions handles the rest automatically.

Prerequisite (one-time): Go to **Settings → Pages → Source → GitHub Actions**.

---

## ⚙️ Configuration

### Customising the Watchlist

Edit `public/stocks.txt` to add, remove, or reorganise stocks. No code changes needed.

```
# Lines starting with # are comments
# [Theme Name] defines a group header

[Hyperscalers]
MSFT
AMZN
GOOGL

[My Custom Group]
AAPL
TSLA
```

Changes take effect immediately on the next page load.

---

## 🤖 Built with Claude Code

This entire application was built through conversational prompts with **[Claude Code](https://claude.ai/code)** (Claude Sonnet) — no manual coding. See [`CLAUDE.md`](CLAUDE.md) for the full prompt history and development log.

---

## 📄 License

MIT © [Shenghao Wang](https://github.com/shenghaowang)

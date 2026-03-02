# CLAUDE.md — Built with Claude Code

This project was built entirely through natural language prompts using **[Claude Code](https://claude.ai/code)** (Anthropic Claude Sonnet), running inside the [OpenClaw](https://openclaw.ai) agent framework. No manual coding was performed.

## What is Claude Code?

Claude Code is Anthropic's AI coding assistant that can read, write, and execute code directly on your machine. Every file in this repository was generated or modified by Claude in response to plain English instructions.

---

## Prompt History

Below is a condensed log of the prompts used to build SwingLens, in order.

### 1. Project Inception
> *"I plan to build a stock picking app based on technical analysis. Main features: download historic closing price data, display stock prices over past 5 years (daily chart), display technical indicators such as MACD, Moving Average, RSI, and identify buy/sell entry points. I'd like to deploy online with no cost via GitHub Pages. What tech stack shall I use?"*

Claude recommended: **React + Vite, TradingView Lightweight Charts, technicalindicators npm package, Yahoo Finance API via corsproxy.io, GitHub Pages + GitHub Actions**.

---

### 2. Scaffold & Build Prototype
> *"I initialized a repo called SwingLens under the projects/ directory. Build a prototype for me using this repo. Feel free to delete any outdated code. Do it on a feature branch."*

Claude:
- Deleted old Python/Streamlit/Docker code
- Scaffolded React + Vite from scratch
- Built `SearchBar`, `PriceChart`, `MacdChart`, `RsiChart`, `SignalSummary` components
- Implemented `fetchStockData` (Yahoo Finance via corsproxy.io)
- Implemented `computeIndicators` (MACD, RSI, SMA) and `computeSignals`
- Added GitHub Actions workflow for auto-deploy to GitHub Pages

---

### 3. Time Range Selector
> *"Now can we allow user to choose the observation window: 5Y, 3Y, 1Y, 6M, 3M, 1M"*

Added `TimeRangeSelector` component with buttons that re-fetch data for the selected range.

---

### 4. Moving Average Overhaul
> *"Replace MA50, MA200 with MA5, MA10, MA20, MA30, MA60, MA120, MA250. Allow users to toggle which MA to be displayed."*

- Replaced fixed MA50/200 with 7 configurable MAs
- Added `MAToggle` component with colour-coded toggle buttons
- Default MAs set to MA30, MA60, MA120

---

### 5. Watchlist with Signal Highlights
> *"On the main page, include a list of popular stocks (e.g. 50 stocks). Highlight the stocks with buy and sell signals separately. Redirect users to its charts if user clicks on a stock. The list of stocks should be configurable via a text file."*

- Built `StockList` and `StockCard` components
- Batched fetching (5 stocks at a time) to avoid rate limiting
- Configurable via `public/stocks.txt`
- Filter buttons: ALL / BUY / SELL / NEUTRAL

---

### 6. Chart Sync on Zoom/Pan
> *"If I zoom on the price chart, is it possible to extend the charts according with updated MA, MACD, RSI?"*

- Merged all three charts into a single `ChartPanel` component
- Synced time scales using `subscribeVisibleLogicalRangeChange`
- Re-applied `autoScale: true` on every zoom/pan event

---

### 7. Auto-Scale Fix (Architecture Refactor)
> *"When I'm on the 1 year chart, if I zoom out, the chart is not auto extended on the left and right sides"*

- Refactored data fetching: **always load 5Y data**, time range buttons only set the visible window
- Eliminated unnecessary re-fetches on range change
- Charts now freely zoom/pan within the full 5Y dataset

---

### 8. Volume Chart
> *"Is it possible to display the volume below the price chart, if the data is available?"*

Added a volume histogram panel below the price chart, colour-coded by candle direction (green/red).

---

### 9. Volume Profile
> *"Display the volume distribution on the left side of the price chart"*

Built `VolumeProfile` component — a canvas-based overlay rendering:
- Horizontal price-volume histogram
- Green (bull) / Red (bear) split per price bucket
- **Point of Control (POC)** — price level with highest volume, highlighted in amber
- Dynamically updates as user zooms/pans

---

### 10. Current Signal Fix
> *"I realize one serious problem. The buy/sell signal should be identified for the current date."*

- Added `computeCurrentSignal()` — evaluates today's MACD and RSI state directly
- Signal summary badge now reflects the **current market state**, not the last historical crossover
- Historical crossover markers remain on chart as context

---

### 11. Themed Watchlist
> *"On the main page, classify the stocks into different themes like Hyperscalers, Value, Defensive, Moonshots, or propose other appropriate themes."*

- Redesigned `stocks.txt` with `[Theme]` group syntax
- Built 8 themed sections: Hyperscalers ☁️, AI & Semiconductors 🤖, Big Tech 📱, Moonshots 🚀, Financials 🏦, Value & Dividend 💰, Defensive 🛡️, ETFs & Indices 📊
- Each group shows its own BUY/SELL count

---

### 12. Error Handling
> *"Display an error message for any invalid ticker"*

Added robust error handling in `fetchStockData`:
- Detects Yahoo Finance error responses
- Handles missing/empty data
- Handles network failures
- Shows descriptive, user-friendly messages

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Always fetch 5Y data | Enables free zoom/pan without re-fetching |
| corsproxy.io for Yahoo Finance | No API key, no backend required |
| Canvas overlay for Volume Profile | Lightweight Charts doesn't support this natively |
| Removed React StrictMode | Prevents lightweight-charts double-disposal in dev |
| `public/stocks.txt` for config | Non-technical users can customise without touching code |
| ResizeObserver over window resize | More reliable for container-level size changes |

---

## Total Development Time

~3 hours of conversational prompting. Zero manual coding.

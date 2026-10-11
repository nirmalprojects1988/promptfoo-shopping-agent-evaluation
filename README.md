# Basketful Shopping-Agent Evaluation

A small hands-on project to explore AI shopping-agent evaluation using the live [Basketful demo](https://shopping-webmcp-demo.netlify.app/).

## Stack

- **Playwright + TypeScript** — browser interaction and cart-state verification.
- **Promptfoo** — evaluation scenarios and assertions.
- **Gemini** — the model connected through the Basketful application's UI.

## What I tested

Two scenarios are currently implemented:

1. **Positive scenario:** Ask the agent to add four packs of Large Eggs and verify the cart quantity and total.
2. **Negative scenario:** Request a nonexistent product and verify that the cart remains empty.

Both scenarios passed in the initial evaluation run.

## How it works

`Promptfoo → Custom Provider → Playwright → Basketful Agent → Observed Cart State → Promptfoo Assertions`

Promptfoo supplies each test prompt to a custom provider. The provider uses Playwright to interact with Basketful, inspects the cart, and returns the observed state for evaluation.

## Setup

1. Install Node.js LTS.
2. Create a `.env` file in the project root and add your own Gemini API key:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Install dependencies and Chromium:

   ```bash
   npm install
   npx playwright install chromium
   ```

4. Run the Promptfoo evaluation:

   ```bash
   npm run promptfoo
   ```

5. To run the standalone Playwright tests:

   ```bash
   npm test
   ```

6. To inspect the evaluation results in the browser:

   ```bash
   npx promptfoo view
   ```

## Current scope

This is an initial proof of concept with two scenarios. The current focus is deterministic verification of observable cart state. Multi-turn conversations, broader failure scenarios, and direct evaluation of WebMCP tool selection are not yet implemented.

## Security

- Never commit `.env` or expose your Gemini API key.
- Use `.env.example` as a template without real credentials.
- Review screenshots and recordings before sharing them publicly.
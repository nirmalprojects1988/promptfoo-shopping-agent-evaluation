
import { test, expect } from '@playwright/test';

const APP_URL = 'https://shopping-webmcp-demo.netlify.app/';

async function connectGemini(page: import('@playwright/test').Page) {
  // Open the shopping application
  await page.goto(APP_URL);

  // Open voice/chat and connect Gemini
  await page.getByRole('button', { name: 'Ask or say…' }).click();

  await page
    .getByRole('button', { name: 'Connect a voice model' })
    .click();

  // Load the API key from .env
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from your .env file');
  }

  await page
    .getByRole('textbox', { name: 'Gemini API key' })
    .fill(apiKey);

  await page.getByRole('button', { name: 'Save key' }).click();
}

test('Positive: agent adds two packs of Large Eggs', async ({ page }) => {
  await connectGemini(page);

  // Ask the agent to add two packs
  const prompt = page.getByRole('textbox', {
    name: 'Ask or say something',
  });

  await prompt.fill(
    'Open Greenleaf Market and add two packs of large eggs to the cart'
  );
  await prompt.press('Enter');

  // Open the cart
  const cartButton = page.getByRole('button', {
    name: /^Open cart:/,
  });

  await cartButton.click();

  const cart = page.getByRole('dialog', {
    name: 'Greenleaf Market cart',
  });

  await expect(cart).toBeVisible();

  // Verify the quantity group exists in the cart
  const eggsQuantity = cart.getByRole('group', {
    name: 'Large Eggs quantity',
  });

  await expect(eggsQuantity).toBeVisible();

  // Verify exactly two packs
  await expect(
    eggsQuantity.getByRole('status')
  ).toHaveText('2');

  // Verify the displayed checkout total
  await expect(
    cart.getByRole('button', {
      name: 'Go to checkout $7.98',
    })
  ).toBeVisible();
});

test('Negative: agent does not add a nonexistent product', async ({ page }) => {
  await connectGemini(page);

  // Ask for a clearly nonexistent product
  const prompt = page.getByRole('textbox', {
    name: 'Ask or say something',
  });

  await prompt.fill(
    'Find and add Quantum Dragon Eggs 999 to my cart at Greenleaf Market'
  );
  await prompt.press('Enter');

  // Open the cart
  const cartButton = page.getByRole('button', {
    name: /^Open cart:/,
  });

  await cartButton.click();

  const cart = page.getByRole('dialog', {
    name: 'Greenleaf Market cart',
  });

  await expect(cart).toBeVisible();

  // Verify the cart remains empty
  await expect(
    cart.getByText('Your cart is empty')
  ).toBeVisible();
});

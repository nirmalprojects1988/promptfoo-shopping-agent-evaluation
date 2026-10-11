import 'dotenv/config';
import { chromium, type Page } from '@playwright/test';
import type {
  ApiProvider,
  ProviderResponse,
  CallApiContextParams,
} from 'promptfoo';

const APP_URL = 'https://shopping-webmcp-demo.netlify.app/';

async function connectGemini(page: Page): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from .env');
  }

  await page.goto(APP_URL);

  await page.getByRole('button', { name: 'Ask or say…' }).click();

  await page
    .getByRole('button', { name: 'Connect a voice model' })
    .click();

  await page.getByRole('textbox', { name: 'Gemini API key' }).fill(apiKey);

  await page.getByRole('button', { name: 'Save key' }).click();
}

async function waitForAgentCompletion(page: Page): Promise<void> {
  // This locator must match the actual visible Thinking indicator.
  const thinking = page.getByText('Thinking', { exact: true });

  // Wait for processing to begin, then finish.
  await thinking.waitFor({ state: 'visible' });
  await thinking.waitFor({ state: 'hidden' });
}

async function inspectCart(page: Page) {
  await page
    .getByRole('button', { name: /^Open cart:/ })
    .click();

  const cart = page.getByRole('dialog', {
    name: 'Greenleaf Market cart',
  });

  await cart.waitFor({ state: 'visible' });

  const empty = cart.getByText('Your cart is empty');

  if (await empty.isVisible().catch(() => false)) {
    return {
      cartEmpty: true,
      quantity: 0,
      checkoutTotal: null,
    };
  }

  const eggsQuantity = cart.getByRole('group', {
    name: 'Large Eggs quantity',
  });

  const quantityStatus = eggsQuantity.getByRole('status');
  const quantityText = await quantityStatus.textContent();

  const quantity = Number(quantityText?.trim());

  if (!Number.isFinite(quantity)) {
    throw new Error(
      `Could not read Large Eggs quantity. Received: ${quantityText}`
    );
  }

  const checkoutButton = cart.getByRole('button', {
    name: /^Go to checkout/,
  });

  const checkoutText = await checkoutButton.textContent();

  const totalMatch = checkoutText?.match(/\$([\d,]+(?:\.\d{2})?)/);

  return {
    cartEmpty: false,
    quantity,
    checkoutTotal: totalMatch ? Number(totalMatch[1].replace(',', '')) : null,
  };
}

export default class BasketfulShoppingProvider implements ApiProvider {
  id(): string {
    return 'basketful-live-agent';
  }

  async callApi(
    prompt: string,
    _options?: CallApiContextParams
  ): Promise<ProviderResponse> {
    const browser = await chromium.launch({ headless: true });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await connectGemini(page);

      const promptBox = page.getByRole('textbox', {
        name: 'Ask or say something',
      });

      await promptBox.fill(prompt);
      await promptBox.press('Enter');

      await waitForAgentCompletion(page);

      const cart = await inspectCart(page);

      const evidence = {
        prompt,
        observed: cart,
      };

      return {
        output: JSON.stringify(evidence),
        metadata: evidence,
      };
    } catch (error) {
      return {
        output: '',
        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    } finally {
      await browser.close();
    }
  }
}

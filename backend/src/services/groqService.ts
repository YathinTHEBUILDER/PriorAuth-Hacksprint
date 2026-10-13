import 'dotenv/config';

interface KeyState {
  key: string;
  maskedKey: string;
  isAvailable: boolean;
  cooldownUntil: number;
  totalCalls: number;
  failureCount: number;
  lastReason?: string;
}

// Keys are loaded securely from process.env.GROQ_API_KEYS (configured in .env)
const DEFAULT_KEYS: string[] = [];

class GroqKeyManager {
  private keyPool: KeyState[] = [];
  private currentKeyIndex = 0;
  private readonly model: string;
  private readonly fallbackModel = 'openai/gpt-oss-20b';

  constructor() {
    const envKeys = process.env.GROQ_API_KEYS
      ? process.env.GROQ_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean)
      : [];

    const keysToUse = envKeys.length > 0 ? envKeys : DEFAULT_KEYS;

    this.keyPool = keysToUse.map((key) => ({
      key,
      maskedKey: `${key.slice(0, 8)}...${key.slice(-6)}`,
      isAvailable: true,
      cooldownUntil: 0,
      totalCalls: 0,
      failureCount: 0,
    }));

    this.model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    console.log(`[GroqManager] Initialized pool with ${this.keyPool.length} keys. Primary model: ${this.model}`);
  }

  private getNextAvailableKeyIndex(): number | null {
    const now = Date.now();
    for (let i = 0; i < this.keyPool.length; i++) {
      const idx = (this.currentKeyIndex + i) % this.keyPool.length;
      const state = this.keyPool[idx];
      if (state.isAvailable || now > state.cooldownUntil) {
        state.isAvailable = true;
        this.currentKeyIndex = idx;
        return idx;
      }
    }
    return null;
  }

  private markKeyFailure(index: number, reason: string, cooldownMs = 60000) {
    const state = this.keyPool[index];
    state.failureCount++;
    state.lastReason = reason;
    state.isAvailable = false;
    state.cooldownUntil = Date.now() + cooldownMs;

    console.warn(
      `⚠️ [GroqManager] Key #${index + 1} (${state.maskedKey}) rate-limited or credits exhausted (${reason}). Rotating to next key...`
    );

    // Switch to next key
    this.currentKeyIndex = (index + 1) % this.keyPool.length;
  }

  public async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    jsonMode = false,
    temperature = 0.2
  ): Promise<string> {
    const maxAttempts = this.keyPool.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      const keyIndex = this.getNextAvailableKeyIndex();

      if (keyIndex === null) {
        throw new Error('All Groq API keys in the failover pool are currently exhausted or rate-limited.');
      }

      const activeState = this.keyPool[keyIndex];
      let selectedModel = this.model;

      try {
        let response = await this.executeChatRequest(activeState.key, selectedModel, messages, jsonMode, temperature);

        if (!response.ok && response.status === 404 && selectedModel !== this.fallbackModel) {
          console.warn(`[GroqManager] Model ${selectedModel} not found. Retrying with fallback model ${this.fallbackModel}...`);
          selectedModel = this.fallbackModel;
          response = await this.executeChatRequest(activeState.key, selectedModel, messages, jsonMode, temperature);
        }

        if (response.ok) {
          activeState.totalCalls++;
          const data: any = await response.json();
          const content = data?.choices?.[0]?.message?.content || '';
          return content;
        }

        const errorBody = await response.text();
        const isRateLimit = response.status === 429 || errorBody.toLowerCase().includes('rate_limit') || errorBody.toLowerCase().includes('tokens per minute');
        const isCreditsExhausted = response.status === 402 || errorBody.toLowerCase().includes('insufficient_quota') || errorBody.toLowerCase().includes('credit');
        const isAuthError = response.status === 401;

        if (isRateLimit || isCreditsExhausted || isAuthError) {
          const reason = isRateLimit ? 'Rate limit exceeded' : isCreditsExhausted ? 'Credits exhausted' : 'Unauthorized / Key expired';
          // 2 minute cooldown for rate limit, 1 hour for credit/auth
          const cooldown = isRateLimit ? 120000 : 3600000;
          this.markKeyFailure(keyIndex, reason, cooldown);
          continue; // Try with next key in pool
        }

        throw new Error(`Groq API error (${response.status}): ${errorBody}`);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          this.markKeyFailure(keyIndex, 'Request timeout', 60000);
          continue;
        }

        if (attempts >= maxAttempts) {
          throw err;
        }

        this.markKeyFailure(keyIndex, err.message || 'Network error', 60000);
      }
    }

    throw new Error('Failed to complete Groq API call after cycling through all available keys.');
  }

  private async executeChatRequest(
    key: string,
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    jsonMode: boolean,
    temperature: number
  ) {
    const payload: any = {
      model,
      messages,
      temperature,
      max_completion_tokens: 4096,
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  public async chatCompletionJSON<T = any>(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    temperature = 0.1
  ): Promise<T> {
    const raw = await this.chatCompletion(messages, true, temperature);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned) as T;
  }

  public getPoolStatus() {
    return {
      activeKeyIndex: this.currentKeyIndex + 1,
      totalKeys: this.keyPool.length,
      model: this.model,
      keys: this.keyPool.map((k, i) => ({
        index: i + 1,
        maskedKey: k.maskedKey,
        isAvailable: k.isAvailable || Date.now() > k.cooldownUntil,
        totalCalls: k.totalCalls,
        failureCount: k.failureCount,
        lastReason: k.lastReason || 'None',
      })),
    };
  }
}

export const groqManager = new GroqKeyManager();

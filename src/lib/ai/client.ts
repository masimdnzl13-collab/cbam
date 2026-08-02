import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

// Sunucu tarafı Claude istemcisi. Yalnızca API route'ları içinde kullanılmalı —
// ANTHROPIC_API_KEY asla istemciye sızdırılmamalı.
export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Bu projede tüm Claude çağrıları için sabit model. Maliyet kontrolü model
// seçimiyle değil, çağrı sıklığıyla sağlanır: belge kontrolü yüklemede bir kez,
// mantık denetimi ve anomali analizi yalnızca kullanıcı talebiyle/kilitleme
// anında çalışır ve sonuçlar Firestore'da önbelleklenir.
export const CLAUDE_MODEL = "claude-opus-4-8";

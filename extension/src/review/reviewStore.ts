import * as vscode from 'vscode';
import { ParsedReview } from '../types';

export function parseReviewText(text: string): ParsedReview {
  // Only handle score, summary, suggestions
  if (!text || typeof text !== 'string') {
    return {
      score: 5,
      summary: 'Code reviewed',
      suggestions: [],
      raw: String(text || '')
    };
  }

  const normalized = text.replace(/\r\n/g, '\n').trim();
  try {
    let cleanedText = normalized;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```$/g, '').trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '').trim();
    }
    const parsed = JSON.parse(cleanedText);
    return {
      score: Number(parsed.score) || 5,
      summary: parsed.summary || 'Code reviewed',
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map((s: any) => typeof s === 'string' ? { suggestion: s } : s)
        : [],
      raw: normalized
    };
  } catch {
    // fallback: try to extract score and suggestions from text
    const scoreMatch = normalized.match(/(?:score|rating)\s*[:=]?\s*(\d{1,2})(?:\s*\/\s*10)?/i);
    const score = scoreMatch ? Math.min(10, Math.max(0, parseInt(scoreMatch[1], 10))) : 5;
    const summary = normalized.split(/\n\s*\n/)[0]?.trim() || 'Code reviewed';
    // fallback: no suggestions if not JSON
    return {
      score,
      summary,
      suggestions: [],
      raw: normalized
    };
  }
  // (No unreachable fallback block)
}

export class ReviewStore {
  private reviews = new Map<string, ParsedReview>();

  set(uri: vscode.Uri, review: ParsedReview): void {
    this.reviews.set(uri.toString(), review);
  }

  get(uri: vscode.Uri): ParsedReview | undefined {
    return this.reviews.get(uri.toString());
  }

  delete(uri: vscode.Uri): void {
    this.reviews.delete(uri.toString());
  }
}

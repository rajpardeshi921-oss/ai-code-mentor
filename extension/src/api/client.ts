/**
 * API Client for Backend Communication
 * 
 * Handles HTTP requests to the backend server for code analysis.
 */

import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import { CodeAnalysis, ApiError } from '../types';

/**
 * Client for communicating with the AI Code Mentor backend
 */
export class ApiClient {
  private backendUrl: string;
  private timeout: number;

  constructor() {
    // Get backend URL from configuration or use default
    const config = vscode.workspace.getConfiguration('aiCodeMentor');
    this.backendUrl = config.get<string>('backendUrl') || 'http://localhost:3000';
    this.timeout = config.get<number>('timeout') || 30000; // 30 seconds default
  }

  /**
   * Sends code to the backend for analysis
   * 
   * @param code - The source code to analyze
   * @param language - Optional language identifier
   * @returns Promise resolving to code analysis result
   */
  async reviewCode(code: string, language?: string): Promise<CodeAnalysis> {
    try {
      console.log(`[API Client] Sending code to backend: ${this.backendUrl}/api/review`);
      
      const response = await axios.post<CodeAnalysis>(
        `${this.backendUrl}/api/review`,
        { code, language },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[API Client] Successfully received analysis from backend');
      return response.data;

    } catch (error) {
      console.error('[API Client] Error during code review:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        // Handle specific error cases
        if (axiosError.code === 'ECONNREFUSED') {
          throw new Error(
            `Cannot connect to backend server at ${this.backendUrl}. ` +
            'Please ensure the backend server is running.'
          );
        }

        if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timed out. The code analysis is taking too long.');
        }

        if (axiosError.response) {
          const status = axiosError.response.status;
          const errorData = axiosError.response.data;

          if (status === 400) {
            throw new Error(`Bad request: ${errorData.message || 'Invalid code provided'}`);
          }

          if (status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          }

          if (status === 500) {
            throw new Error(
              `Server error: ${errorData.message || 'The backend encountered an error'}`
            );
          }

          throw new Error(
            errorData.message || `Server returned error status ${status}`
          );
        }
      }

      // Generic error
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred during code analysis'
      );
    }
  }

  /**
   * Checks if the backend server is running and responsive
   * 
   * @returns Promise resolving to true if backend is available
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.backendUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('[API Client] Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Gets the current backend URL
   */
  getBackendUrl(): string {
    return this.backendUrl;
  }

  /**
   * Updates the backend URL (useful for settings changes)
   */
  setBackendUrl(url: string): void {
    this.backendUrl = url;
  }
}

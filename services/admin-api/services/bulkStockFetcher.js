const tradingCodes = require('../data/tradingCodes');
const stockScraper = require('./stockScraper');
const Stock = require('../models/Stock');

class BulkStockFetcher {
  constructor() {
    this.isRunning = false;
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: null,
      startTime: null,
      errors: []
    };
    this.batchSize = 5; // Process 5 stocks at a time to avoid overwhelming the server
    this.delayBetweenBatches = 2000; // 2 seconds delay between batches
  }

  async fetchAllStocks() {
    if (this.isRunning) {
      throw new Error('Bulk fetch is already running');
    }

    this.isRunning = true;
    this.progress = {
      total: tradingCodes.length,
      completed: 0,
      failed: 0,
      current: null,
      startTime: new Date(),
      errors: []
    };

    console.log(`Starting bulk fetch for ${tradingCodes.length} stocks...`);

    try {
      // Process stocks in batches
      for (let i = 0; i < tradingCodes.length; i += this.batchSize) {
        const batch = tradingCodes.slice(i, i + this.batchSize);
        await this.processBatch(batch);
        
        // Add delay between batches to be respectful to the server
        if (i + this.batchSize < tradingCodes.length) {
          await this.delay(this.delayBetweenBatches);
        }
      }

      console.log(`Bulk fetch completed. Success: ${this.progress.completed}, Failed: ${this.progress.failed}`);
      return this.progress;
    } catch (error) {
      console.error('Bulk fetch error:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.progress.current = null;
    }
  }

  async processBatch(batch) {
    const promises = batch.map(tradingCode => this.fetchSingleStock(tradingCode));
    await Promise.allSettled(promises);
  }

  async fetchSingleStock(tradingCode) {
    this.progress.current = tradingCode;
    
    try {
      console.log(`Fetching ${tradingCode}... (${this.progress.completed + 1}/${this.progress.total})`);
      
      const stockData = await stockScraper.fetchStockData(tradingCode);
      
      // Update or create stock in database (exact behavior from Stock-fetcher-mongo)
      await Stock.findOneAndUpdate(
        { tradingCode: tradingCode },
        {
          ...stockData,
          lastUpdated: new Date()
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true
        }
      );

      this.progress.completed++;
      console.log(`✓ Successfully fetched ${tradingCode}`);
      
    } catch (error) {
      this.progress.failed++;
      const errorInfo = {
        tradingCode,
        error: error.message,
        timestamp: new Date()
      };
      this.progress.errors.push(errorInfo);
      console.error(`✗ Failed to fetch ${tradingCode}:`, error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProgress() {
    return {
      ...this.progress,
      isRunning: this.isRunning,
      percentage: this.progress.total > 0 ? Math.round((this.progress.completed + this.progress.failed) / this.progress.total * 100) : 0,
      estimatedTimeRemaining: this.calculateEstimatedTime()
    };
  }

  calculateEstimatedTime() {
    if (!this.progress.startTime || this.progress.completed === 0) {
      return null;
    }

    const elapsed = Date.now() - this.progress.startTime.getTime();
    const avgTimePerStock = elapsed / (this.progress.completed + this.progress.failed);
    const remaining = this.progress.total - (this.progress.completed + this.progress.failed);
    
    return Math.round(remaining * avgTimePerStock / 1000); // in seconds
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      console.log('Bulk fetch stopped by user');
    }
  }
}

// Create singleton instance
module.exports = new BulkStockFetcher();
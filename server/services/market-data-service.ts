/**
 * Market Data Service - Real-time stock data integration
 * Supports multiple APIs with fallback capabilities
 */

interface MarketDataProvider {
  name: string;
  getQuote(symbol: string): Promise<StockQuote>;
  getMultipleQuotes(symbols: string[]): Promise<StockQuote[]>;
  isConfigured(): boolean;
}

interface StockQuote {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  volume: number;
  timestamp: Date;
}

export class AlphaVantageProvider implements MarketDataProvider {
  name = "Alpha Vantage";
  private apiKey: string;
  private baseUrl = "https://www.alphavantage.co/query";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    if (!this.isConfigured()) {
      throw new Error("Alpha Vantage API key not configured");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data["Error Message"]) {
        throw new Error(`API Error: ${data["Error Message"]}`);
      }
      
      if (data["Note"]) {
        throw new Error("API rate limit exceeded");
      }
      
      const quote = data["Global Quote"];
      if (!quote) {
        throw new Error("Invalid response format");
      }

      return {
        symbol: quote["01. symbol"],
        price: quote["05. price"],
        change: quote["09. change"],
        changePercent: quote["10. change percent"].replace('%', ''),
        volume: parseInt(quote["06. volume"]) || 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    // Alpha Vantage doesn't support batch requests on free tier
    // We'll fetch them sequentially with rate limiting
    const quotes: StockQuote[] = [];
    
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        quotes.push(quote);
        
        // Rate limiting: 5 requests per minute
        if (symbols.indexOf(symbol) < symbols.length - 1) {
          await this.delay(12000); // 12 seconds between requests
        }
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        // Continue with other symbols
      }
    }
    
    return quotes;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class IEXCloudProvider implements MarketDataProvider {
  name = "IEX Cloud";
  private apiKey: string;
  private baseUrl = "https://cloud.iexapis.com/stable";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.IEX_CLOUD_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    if (!this.isConfigured()) {
      throw new Error("IEX Cloud API key not configured");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/stock/${symbol}/quote?token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }

      return {
        symbol: data.symbol,
        price: data.latestPrice?.toString() || "0",
        change: data.change?.toString() || "0",
        changePercent: data.changePercent ? (data.changePercent * 100).toFixed(2) : "0",
        volume: data.latestVolume || 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`IEX Cloud API error for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    // IEX Cloud supports batch requests - much faster!
    const symbolsString = symbols.join(',');
    
    try {
      const response = await fetch(
        `${this.baseUrl}/stock/market/batch?symbols=${symbolsString}&types=quote&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const quotes: StockQuote[] = [];
      
      for (const symbol of symbols) {
        const stockData = data[symbol];
        if (stockData && stockData.quote) {
          const quote = stockData.quote;
          quotes.push({
            symbol: quote.symbol,
            price: quote.latestPrice?.toString() || "0",
            change: quote.change?.toString() || "0",
            changePercent: quote.changePercent ? (quote.changePercent * 100).toFixed(2) : "0",
            volume: quote.latestVolume || 0,
            timestamp: new Date()
          });
        }
      }
      
      return quotes;
    } catch (error) {
      console.error(`IEX Cloud batch API error:`, error);
      throw error;
    }
  }
}

export class TwelvedataProvider implements MarketDataProvider {
  name = "Twelvedata";
  private apiKey: string;
  private baseUrl = "https://api.twelvedata.com";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TWELVEDATA_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    if (!this.isConfigured()) {
      throw new Error("Twelvedata API key not configured");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/price?symbol=${symbol}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const priceData = await response.json();
      
      if (priceData.status === "error") {
        throw new Error(`API Error: ${priceData.message}`);
      }

      // Get additional quote data
      const quoteResponse = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}&apikey=${this.apiKey}`
      );
      
      let quoteData = { change: "0", percent_change: "0", volume: 0 };
      if (quoteResponse.ok) {
        quoteData = await quoteResponse.json();
      }

      return {
        symbol,
        price: priceData.price || "0",
        change: quoteData.change || "0",
        changePercent: quoteData.percent_change ? quoteData.percent_change.replace('%', '') : "0",
        volume: quoteData.volume || 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Twelvedata API error for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    // Twelvedata supports batch requests with comma-separated symbols
    const symbolsString = symbols.join(',');
    
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbolsString}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const quotes: StockQuote[] = [];
      
      // Handle both single symbol and batch responses
      const results = Array.isArray(data) ? data : [data];
      
      for (const quote of results) {
        if (quote.symbol) {
          quotes.push({
            symbol: quote.symbol,
            price: quote.close || "0",
            change: quote.change || "0",
            changePercent: quote.percent_change ? quote.percent_change.replace('%', '') : "0",
            volume: quote.volume || 0,
            timestamp: new Date()
          });
        }
      }
      
      return quotes;
    } catch (error) {
      console.error(`Twelvedata batch API error:`, error);
      throw error;
    }
  }
}

export class FinnhubProvider implements MarketDataProvider {
  name = "Finnhub";
  private apiKey: string;
  private baseUrl = "https://finnhub.io/api/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FINNHUB_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    if (!this.isConfigured()) {
      throw new Error("Finnhub API key not configured");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }

      return {
        symbol,
        price: data.c?.toString() || "0",
        change: data.d?.toString() || "0",
        changePercent: data.dp?.toString() || "0",
        volume: 0, // Finnhub requires separate call for volume
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Finnhub API error for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes: StockQuote[] = [];
    
    // Finnhub allows 60 calls per minute, so we can be more aggressive
    const promises = symbols.map(async (symbol) => {
      try {
        return await this.getQuote(symbol);
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    return results.filter((quote): quote is StockQuote => quote !== null);
  }
}

// Fallback provider using simulated data
export class MockProvider implements MarketDataProvider {
  name = "Mock Data";

  isConfigured(): boolean {
    return true;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    // Simulate realistic stock price movements
    const basePrice = this.getBasePrice(symbol);
    const change = (Math.random() - 0.5) * basePrice * 0.05; // ±5% max change
    const price = basePrice + change;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: price.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      volume: Math.floor(Math.random() * 10000000),
      timestamp: new Date()
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    return Promise.all(symbols.map(symbol => this.getQuote(symbol)));
  }

  private getBasePrice(symbol: string): number {
    // Base prices for common stocks
    const prices: Record<string, number> = {
      'AAPL': 175,
      'TSLA': 250,
      'NVDA': 890,
      'MSFT': 415,
      'AMZN': 180,
      'GOOGL': 170,
      'META': 485,
      'NFLX': 450,
      'AMD': 150,
      'INTC': 45
    };
    return prices[symbol] || 100;
  }
}

export class MarketDataService {
  private providers: MarketDataProvider[] = [];
  private currentProviderIndex = 0;

  constructor() {
    // Initialize providers in order of preference (best free ones first!)
    this.providers = [
      new IEXCloudProvider(),     // 50,000 calls/month FREE
      new TwelvedataProvider(),   // 800 calls/day FREE  
      new AlphaVantageProvider(), // 25 calls/day free (fallback)
      new FinnhubProvider(),      // 60 calls/minute
      new MockProvider()          // Always available as fallback
    ];
  }

  getCurrentProvider(): MarketDataProvider {
    return this.providers[this.currentProviderIndex];
  }

  getConfiguredProviders(): MarketDataProvider[] {
    return this.providers.filter(p => p.isConfigured());
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      if (!provider.isConfigured()) {
        continue;
      }

      try {
        console.log(`Fetching quote for ${symbol} using ${provider.name}`);
        const quote = await provider.getQuote(symbol);
        
        // Update current provider index to successful one
        this.currentProviderIndex = i;
        return quote;
      } catch (error) {
        console.error(`Provider ${provider.name} failed for ${symbol}:`, error);
        
        // Continue to next provider
        continue;
      }
    }

    throw new Error("All market data providers failed");
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      if (!provider.isConfigured()) {
        continue;
      }

      try {
        console.log(`Fetching quotes for ${symbols.length} symbols using ${provider.name}`);
        const quotes = await provider.getMultipleQuotes(symbols);
        
        // Update current provider index to successful one
        this.currentProviderIndex = i;
        return quotes;
      } catch (error) {
        console.error(`Provider ${provider.name} failed for multiple quotes:`, error);
        
        // Continue to next provider
        continue;
      }
    }

    throw new Error("All market data providers failed");
  }

  async refreshMarketData(): Promise<StockQuote[]> {
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL'];
    return this.getMultipleQuotes(symbols);
  }
}

export const marketDataService = new MarketDataService();
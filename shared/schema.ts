import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username"),
  email: text("email").notNull().unique(),
  password: text("password"), // Optional for OAuth users
  provider: text("provider"), // 'google', 'yahoo', or null for local
  providerId: text("provider_id"), // OAuth provider's user ID
  name: text("name"),
  bio: text("bio"),
  avatar: text("avatar"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"), // TOTP secret for 2FA
  backupCodes: text("backup_codes").array(), // Array of backup codes for 2FA recovery
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("100000.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull().default("0.00"),
  dailyPnl: decimal("daily_pnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  dailyPnlPercent: decimal("daily_pnl_percent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  averagePrice: decimal("average_price", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }).notNull(),
  marketValue: decimal("market_value", { precision: 15, scale: 2 }).notNull(),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  unrealizedPnlPercent: decimal("unrealized_pnl_percent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'BUY' or 'SELL'
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  pnl: decimal("pnl", { precision: 15, scale: 2 }).default("0.00"),
  isAutomatic: boolean("is_automatic").notNull().default(false),
  strategyName: text("strategy_name"),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
});

export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  name: text("name").notNull(),
  description: text("description"),
  riskAllocation: decimal("risk_allocation", { precision: 5, scale: 2 }).notNull(), // percentage
  isActive: boolean("is_active").notNull().default(true),
  totalPnl: decimal("total_pnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  configuration: jsonb("configuration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull().unique(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  change: decimal("change", { precision: 15, scale: 2 }).notNull().default("0.00"),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  volume: integer("volume").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'DEPOSIT' or 'WITHDRAWAL'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("PENDING"), // 'PENDING', 'COMPLETED', 'FAILED'
  method: text("method"), // 'BANK_ACCOUNT', 'CREDIT_CARD', 'WIRE_TRANSFER'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// OAuth User creation schema
export const oauthUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  provider: z.enum(["google", "yahoo"]),
  providerId: z.string(),
});

export const updateProfileSchema = createInsertSchema(users).pick({
  name: true,
  username: true,
  bio: true,
  avatar: true,
}).partial();

export const updateNotificationsSchema = createInsertSchema(users).pick({
  emailNotifications: true,
  pushNotifications: true,
}).partial();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// 2FA Schemas
export const enable2FASchema = z.object({
  token: z.string().min(6).max(6).regex(/^\d{6}$/, "Token must be 6 digits"),
});

export const verify2FASchema = z.object({
  token: z.string().min(6).max(6).regex(/^\d{6}$/, "Token must be 6 digits"),
});

export const verifyBackupCodeSchema = z.object({
  code: z.string().min(8).max(12).regex(/^[A-Z0-9]+$/, "Invalid backup code format"),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, "Password is required to disable 2FA"),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
});

export const insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  createdAt: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Advanced Strategy Configuration Schema
export const strategyConfigSchema = z.object({
  // General Settings
  isActive: z.boolean().default(true),
  riskAllocation: z.number().min(1).max(50),
  maxPositionSize: z.number().min(1).max(15),
  
  // Technical Indicators
  rsi: z.object({
    enabled: z.boolean(),
    period: z.number().min(5).max(30),
    overbought: z.number().min(65).max(85),
    oversold: z.number().min(15).max(35)
  }),
  
  macd: z.object({
    enabled: z.boolean(),
    fastPeriod: z.number().min(8).max(20),
    slowPeriod: z.number().min(20).max(35),
    signalPeriod: z.number().min(5).max(15)
  }),
  
  bollinger: z.object({
    enabled: z.boolean(),
    period: z.number().min(10).max(30),
    stdDev: z.number().min(1).max(3)
  }),
  
  movingAverages: z.object({
    sma: z.object({
      enabled: z.boolean(),
      period: z.number().min(10).max(200)
    }),
    ema: z.object({
      enabled: z.boolean(),
      period: z.number().min(5).max(100)
    })
  }),
  
  // Risk Management
  stopLoss: z.object({
    enabled: z.boolean(),
    percentage: z.number().min(3).max(20),
    trailing: z.boolean()
  }),
  
  takeProfit: z.object({
    enabled: z.boolean(),
    percentage: z.number().min(5).max(50),
    partial: z.boolean()
  }),
  
  // Market Conditions
  marketFilters: z.object({
    volatilityFilter: z.boolean(),
    volumeFilter: z.boolean(),
    trendFilter: z.boolean()
  }),
  
  // Machine Learning
  machineLearning: z.object({
    enabled: z.boolean(),
    modelConfidence: z.number().min(50).max(95),
    ensembleVoting: z.boolean(),
    featureEngineering: z.boolean()
  }),
  
  // News & Sentiment
  sentiment: z.object({
    enabled: z.boolean(),
    newsWeight: z.number().min(0.1).max(0.6),
    socialWeight: z.number().min(0.1).max(0.4),
    analystWeight: z.number().min(0.1).max(0.5)
  })
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type StrategyConfig = z.infer<typeof strategyConfigSchema>;

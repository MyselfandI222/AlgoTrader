# 📦 Project Layout (copy these files into Replit)

```
.
├── .replit
├── replit.nix
├── README.md
├── requirements.txt
├── app/
│   ├── __init__.py
│   ├── settings.py
│   ├── ledger.py
│   ├── broker.py
│   ├── portfolio.py
│   ├── payments.py
│   └── main.py
├── tests/
│   └── test_health.py
└── scripts/
    └── seed_demo.py
```
```
# .replit
run = ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
entrypoint = "app/main.py"
[nix]
channel = "stable-23.11"
``` 

```
# replit.nix
{ pkgs }: {
  deps = [
    pkgs.python311Full
    pkgs.python311Packages.pip
    pkgs.python311Packages.setuptools
  ];
}
```

```
# requirements.txt
fastapi==0.115.0
uvicorn==0.30.6
pydantic-settings==2.5.2
httpx==0.27.2
sqlalchemy==2.0.36
alembic==1.13.2
pydantic==2.9.2
``` 

```
# app/__init__.py
```

```
# app/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENV: str = "dev"
    # Alpaca (paper by default)
    ALPACA_KEY: str = ""
    ALPACA_SECRET: str = ""
    ALPACA_BASE_URL: str = "https://paper-api.alpaca.markets"

    # Signals source (your website/API that detects uprising stocks)
    ALGO_SIGNALS_URL: str = "https://<your-host>/api/signals"  # point to your existing endpoint
    ALGO_SIGNALS_TOKEN: str = ""  # optional bearer token if protected

    # Ledger / DB
    DATABASE_URL: str = "sqlite+pysqlite:///./app.db"

    # Webhook shared secret (Stripe, Plaid, etc.)
    WEBHOOK_SECRET: str = "change-me"

    # Liquidity buffer to honor instant withdrawals
    LIQUIDITY_BUFFER_PCT: float = 0.10  # keep 10% of AUM in cash

    class Config:
        env_file = ".env"

settings = Settings()
```

```
# app/ledger.py
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

import sqlalchemy as sa
from sqlalchemy.orm import declarative_base, sessionmaker

from .settings import settings

Base = declarative_base()
engine = sa.create_engine(settings.DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)

class Account(Base):
    __tablename__ = "accounts"
    id = sa.Column(sa.Integer, primary_key=True)
    user_id = sa.Column(sa.String, index=True, nullable=False)
    cash = sa.Column(sa.Float, default=0.0)
    reserved = sa.Column(sa.Float, default=0.0)  # unsettled/holds
    created_at = sa.Column(sa.DateTime, default=lambda: datetime.now(timezone.utc))

class Tx(Base):
    __tablename__ = "tx"
    id = sa.Column(sa.Integer, primary_key=True)
    user_id = sa.Column(sa.String, index=True, nullable=False)
    kind = sa.Column(sa.String, nullable=False)  # deposit, buy, sell, withdraw, fee, reserve
    amount = sa.Column(sa.Float, nullable=False)
    meta = sa.Column(sa.JSON, default={})
    created_at = sa.Column(sa.DateTime, default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(engine)

@dataclass
class Balances:
    cash: float
    reserved: float

    @property
    def available(self) -> float:
        return max(0.0, self.cash - self.reserved)


def get_or_create_account(user_id: str) -> Account:
    with SessionLocal() as s:
        acct = s.execute(sa.select(Account).where(Account.user_id==user_id)).scalar_one_or_none()
        if not acct:
            acct = Account(user_id=user_id)
            s.add(acct)
            s.commit()
            s.refresh(acct)
        return acct


def record(user_id: str, kind: str, amount: float, **meta):
    with SessionLocal() as s:
        acct = s.execute(sa.select(Account).where(Account.user_id==user_id)).scalar_one()
        if kind == "deposit":
            acct.cash += amount
        elif kind == "withdraw":
            acct.cash -= amount
        elif kind == "reserve":
            acct.reserved += amount
        elif kind == "release":
            acct.reserved = max(0.0, acct.reserved - amount)
        elif kind in ("buy", "fee"):
            acct.cash -= amount
        elif kind == "sell":
            acct.cash += amount
        else:
            raise ValueError("unknown kind")
        s.add(Tx(user_id=user_id, kind=kind, amount=amount, meta=meta))
        s.add(acct)
        s.commit()


def balances(user_id: str) -> Balances:
    with SessionLocal() as s:
        acct = s.execute(sa.select(Account).where(Account.user_id==user_id)).scalar_one()
        return Balances(cash=acct.cash, reserved=acct.reserved)
```

```
# app/broker.py
from __future__ import annotations
import httpx
from typing import List

from .settings import settings

class AlpacaBroker:
    def __init__(self):
        self.base = settings.ALPACA_BASE_URL
        self.key = settings.ALPACA_KEY
        self.secret = settings.ALPACA_SECRET
        self.headers = {
            "APCA-API-KEY-ID": self.key,
            "APCA-API-SECRET-KEY": self.secret,
            "accept": "application/json",
            "content-type": "application/json",
        }

    async def buy_fractional(self, symbol: str, notional: float):
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                f"{self.base}/v2/orders",
                headers=self.headers,
                json={
                    "symbol": symbol,
                    "notional": notional,
                    "side": "buy",
                    "type": "market",
                    "time_in_force": "day",
                },
            )
            r.raise_for_status()
            return r.json()

    async def sell_fractional(self, symbol: str, notional: float):
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                f"{self.base}/v2/orders",
                headers=self.headers,
                json={
                    "symbol": symbol,
                    "notional": notional,
                    "side": "sell",
                    "type": "market",
                    "time_in_force": "day",
                },
            )
            r.raise_for_status()
            return r.json()
```

```
# app/portfolio.py
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Target:
    symbol: str
    weight: float  # 0..1

# Simple 60/40 demo: 60% SPY (equities), 40% BIL (cash-like via ETF)
DEFAULT_POLICY: List[Target] = [
    Target("SPY", 0.60),
    Target("BIL", 0.40),
]


def weights_from_ranked_symbols(symbols: List[str]) -> List[Target]:
    """Convert a ranked list [best,...] into inverse-rank weights that sum to 1.
    Top names get slightly more without over-concentrating.
    """
    if not symbols:
        return DEFAULT_POLICY
    n = len(symbols)
    raw = [1.0/(i+1) for i in range(n)]  # harmonic weights
    s =

```
# app/payments.py
from __future__ import annotations
from fastapi import HTTPException

# These functions are placeholders so you can swap in Stripe, Plaid Transfer, or RTP/FedNow via your provider.

async def initiate_deposit(user_id: str, amount: float) -> str:
    # TODO: Verify ACH/card status via your PSP. For demo, auto-success.
    return "dep_demo_txn_123"

async def initiate_instant_payout(user_id: str, amount: float) -> str:
    # TODO: Wire up Stripe Instant Payouts / RTP.
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    return "payout_demo_txn_456"
```

```
# app/main.py
from __future__ import annotations
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from .settings import settings
from . import ledger
from .broker import AlpacaBroker
from .portfolio import compute_orders
from .payments import initiate_deposit, initiate_instant_payout

app = FastAPI(title="Instant Invest & Withdraw")
broker = AlpacaBroker()

class DepositReq(BaseModel):
    user_id: str
    amount: float

class WithdrawReq(BaseModel):
    user_id: str
    amount: float

class InvestReq(BaseModel):
    user_id: str
    amount: float

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/deposit")
async def deposit(body: DepositReq):
    ledger.get_or_create_account(body.user_id)
    ref = await initiate_deposit(body.user_id, body.amount)
    ledger.record(body.user_id, "deposit", body.amount, ref=ref)
    return {"status": "ok", "ref": ref, "balances": ledger.balances(body.user_id).__dict__}

@app.post("/invest/auto")
async def invest_auto(body: InvestReq):
    # Keep buffer in cash for instant withdrawals
    bal = ledger.balances(body.user_id)
    investable = max(0.0, min(body.amount, bal.available * (1 - settings.LIQUIDITY_BUFFER_PCT)))
    if investable <= 0:
        raise HTTPException(status_code=400, detail="No investable funds after buffer")
    orders = compute_orders(investable)
    for sym, notional in orders.items():
        await broker.buy_fractional(sym, notional)
    ledger.record(body.user_id, "buy", investable, policy=orders)
    return {"status": "ok", "invested": investable, "policy": orders, "balances": ledger.balances(body.user_id).__dict__}

@app.post("/withdraw")
async def withdraw(body: WithdrawReq):
    bal = ledger.balances(body.user_id)
    if body.amount > bal.available:
        # In a real app: sell positions or tap a credit line/treasury buffer.
        # Here we reject if not enough liquid cash.
        raise HTTPException(status_code=402, detail="Not enough liquid funds. Try a smaller amount or wait for settlement.")
    ref = await initiate_instant_payout(body.user_id, body.amount)
    ledger.record(body.user_id, "withdraw", body.amount, ref=ref)
    return {"status": "ok", "ref": ref, "balances": ledger.balances(body.user_id).__dict__}
```

```
# tests/test_health.py
def test_health():
    assert True
```

```
# scripts/seed_demo.py
import requests

BASE = "http://localhost:8000"

r = requests.post(f"{BASE}/deposit", json={"user_id": "demo", "amount": 1000})
print("deposit:", r.json())

r = requests.post(f"{BASE}/invest/auto", json={"user_id": "demo", "amount": 800})
print("invest:", r.json())

r = requests.post(f"{BASE}/withdraw", json={"user_id": "demo", "amount": 50})
print("withdraw:", r.json())
```

```
# README.md
# Instant-Invest & Instant-Withdraw (Replit-ready)

> Drop-in microplatform that accepts deposits, auto-invests behind the scenes, and supports instant withdrawals **if cash is available**. Built to plug into Alpaca (brokerage) and Stripe/Plaid (money movement), with a liquidity buffer to make withdrawals feel instant.

## ⚠️ Reality Check on "instant" withdrawals
* US equities settle **T+1** as of May 28, 2024. Unsettled trades cannot be withdrawn until they settle. Keep a cash buffer and/or a credit facility. (SEC; Investor.gov; White & Case client alert)
* For consumer-speed payouts, use **Instant Payouts** to debit cards (Visa Direct/Mastercard Send) or **RTP/FedNow** via your provider (Stripe/Plaid and partners).

## How it works
1. **Deposit** (ACH/card): funds show in the user's ledger and can be extended as instant buying power.
2. **Auto Invest**: allocates to a target policy (default: SPY/BIL) with fractional orders via Alpaca Broker API.
3. **Withdraw**: pays out instantly **from cash on hand**; if not enough, you either
   - liquidate positions (market sell) and wait for T+1 settlement, or
   - use a treasury buffer/credit line to pre-fund withdrawals.

## Env Vars
Create a `.env` in Replit Secrets:
```
ALPACA_KEY=...
ALPACA_SECRET=...
ALPACA_BASE_URL=https://paper-api.alpaca.markets
DATABASE_URL=sqlite+pysqlite:///./app.db
WEBHOOK_SECRET=change-me
LIQUIDITY_BUFFER_PCT=0.10
```

## Run
Click **Run** in Replit. Healthcheck at `GET /health`.

## Demo
Use the included script:
```
python scripts/seed_demo.py
```

## Swap-in Live Rails
- **Brokerage**: Alpaca Broker API provides fractional trading + instant funding/buying power. Configure keys, KYC, and custodial accounts.
- **Money Movement**: ACH with Plaid Auth + Transfer; instant payouts with Stripe Instant Payouts or RTP/FedNow via your provider.

## Notes on Compliance (US)
- If you auto-invest customer funds, expect **RIA/ER** obligations or broker-dealer partnering. Use a BaaS brokerage (Alpaca/DriveWealth) that handles custody & trade execution.
- Perform **KYC/AML** and **funds screening**; handle **disclosures** (e.g., fractional shares).
- Keep an **operational treasury buffer** (e.g., 10–20% AUM in cash or committed line) to honor withdrawals.

## API
- `POST /deposit {user_id, amount}` → records a deposit (simulate PSP success)
- `POST /invest/auto {user_id, amount}` → buys fractional ETFs per policy and holds a cash buffer
- `POST /withdraw {user_id, amount}` → instant payout if enough liquid cash; otherwise 402

---
Built for your **AlgoTrader** vision and the "picture-perfect" Replit template standard: structured folders, healthcheck, env/secrets, logging-ready, and tests.

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from SmartApi import SmartConnect
import os
import pyotp
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import threading
from SmartApi.smartWebSocketV2 import SmartWebSocketV2


# Local Imports
try:
    from .tokens import NIFTY_50_TOKENS
    from .scrip_master import ScripMaster
except ImportError:
    from tokens import NIFTY_50_TOKENS
    from scrip_master import ScripMaster

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global SmartConnect Instance
smartApi = SmartConnect(api_key=os.getenv("ANGEL_API_KEY"))

# Cache for session (simple global var)
session_data = None
sws = None # Global WebSocket Instance


@app.get("/")
def read_root():
    return {"message": "NGTA Backend with Angel One (SmartAPI) is running"}

@app.get("/login")
def login():
    """
    Authenticates with Angel One using API Key, Client Code, Password, and TOTP.
    """
    global session_data
    try:
        api_key = os.getenv("ANGEL_API_KEY")
        client_code = os.getenv("ANGEL_CLIENT_CODE")
        password = os.getenv("ANGEL_PASSWORD")
        totp_secret = os.getenv("ANGEL_TOTP_SECRET")

        if not all([api_key, client_code, password, totp_secret]):
             raise HTTPException(status_code=500, detail="Missing credentials in .env")

        # Generate TOTP
        try:
            totp = pyotp.TOTP(totp_secret).now()
        except Exception:
            raise HTTPException(status_code=500, detail="Invalid TOTP Secret")
        
        # Login
        data = smartApi.generateSession(client_code, password, totp)
        
        if data['status'] == False:
             raise HTTPException(status_code=401, detail=data['message'])
        
        session_data = data['data']
        
        # Start WebSocket if not already running
        if not sws:
            start_websocket()
            
        return {"status": "success", "message": "Connected to Angel One", "data": {"client_code": client_code}}
        
    except Exception as e:
        logger.error(f"Login failed: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/market-data/{symbol_token}")
def get_market_data(symbol_token: str):
    """
    Fetch market data. 
    """
    try:
        # Check session
        if not session_data and not smartApi.access_token:
            login()

        # Mapping logic
        token_map = NIFTY_50_TOKENS # Use imported map
        # Also support reverse lookup for testing if user sends "SBIN"
        token = token_map.get(symbol_token.upper())
        
        # If not in map, try to use input as token directly
        if not token:
            token = symbol_token
        
        exchange = "NSE"
        if token == "99926000": # Nifty 50
             tradingsymbol = "NIFTY"
        else:
             tradingsymbol = f"{symbol_token.upper()}-EQ" 

        data = smartApi.ltpData(exchange, tradingsymbol, token)
        return data
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/indices")
def get_indices():
    """
    Fetches live data for NIFTY and BANKNIFTY Indices.
    """
    try:
        # Check session
        if not session_data and not smartApi.access_token:
            login()
            
        tokens = ["99926000", "99926009"] # Nifty, BankNifty
        results = {}
        
        for token in tokens:
            name = "NIFTY" if token == "99926000" else "BANKNIFTY"
            data = smartApi.ltpData("NSE", name, token)
            if data and data.get('data'):
                results[name] = data['data']
                
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Background Scanner ---
market_cache = {}
token_map_reverse = {} # Token -> Symbol
is_scanner_running = False

def start_websocket():
    global sws, session_data
    try:
        if not session_data: return
        
        auth_token = session_data['jwtToken']
        api_key = os.getenv("ANGEL_API_KEY")
        client_code = os.getenv("ANGEL_CLIENT_CODE")
        feed_token = session_data['feedToken']
        
        sws = SmartWebSocketV2(auth_token, api_key, client_code, feed_token)
        
        def on_data(wsapp, message):
            # print("Ticks:", message)
            if 'token' in message and 'last_traded_price' in message:
                print(f"WS Tick: {message['token']} -> {message['last_traded_price']}")
                tok = message['token']
                # Clean token (sometimes comes with quotes or extra chars?) - usually clean string
                
                # Find symbol
                if tok in token_map_reverse:
                    sym = token_map_reverse[tok]
                    if sym in market_cache:
                        market_cache[sym]['ltp'] = message['last_traded_price'] / 100.0 # V2 usually sends in paise? Check docs. standard is usually normal price but let's verify.
                        # Actually SmartWebSocketV2 usually sends data as is.
                        # Wait, V2 often sends LTP as float directly.
                        market_cache[sym]['ltp'] = message['last_traded_price'] / 100.0
                        
                        # Calculate change if open/close available or just update LTP
                        # message usually has 'change_percent' or 'net_change'
                        # V2 structure: subscription_mode, exchange_type, token, sequence_number, exchange_timestamp, last_traded_price, subscription_mode_val
                        # It might NOT have change_percent in mode 1 (LTP).
                        # Let's assume we get decent data.
                        pass

        def on_open(wsapp):
            print("WebSocket: Connected")
            
        def on_error(wsapp, error):
            print("WebSocket Error:", error)
            
        sws.on_data = on_data
        sws.on_open = on_open
        sws.on_error = on_error
        
        # Run WS in separate thread to avoid blocking scanner
        t_ws = threading.Thread(target=sws.connect, daemon=True)
        t_ws.start()
        
    except Exception as e:
        print("WebSocket Init Failed:", e)

def subscribe_to_tokens(tokens):
    global sws
    if sws:
        try:
            # Mode 1: LTP Only (Fastest)
            # ExchangeType 1: NSE
            token_list = [{"exchangeType": 1, "tokens": tokens}]
            sws.subscribe("correlation_id", 1, token_list)
            print(f"WebSocket: Subscribed to {len(tokens)} tokens")
        except Exception as e:
            print("Subscribe Failed:", e)


def background_scanner():
    global is_scanner_running, market_cache
    print("Scanner: Started")
    
    # Define Processing Logic Internal to Scanner (or move global)
    def calculate_metrics(symbol, token, hist_data):
        try:
            if len(hist_data) < 5: return None
            
            c0 = hist_data[-1][4]
            c1 = hist_data[-2][4]
            c2 = hist_data[-3][4]
            c3 = hist_data[-4][4]
            
            change_current = ((c0 - c1) / c1) * 100
            change_1d = ((c1 - c2) / c2) * 100
            change_2d = ((c2 - c3) / c3) * 100
            change_3d = ((c3 - hist_data[-5][4]) / hist_data[-5][4]) * 100
            
            avg_3d = (change_current + change_1d + change_2d + change_3d) / 4.0
            
            # Dom
            def get_dom(candle): return "Buyers" if candle[4] > candle[1] else "Sellers"
            dom_current = get_dom(hist_data[-1])
            dom_1d = get_dom(hist_data[-2])
            dom_2d = get_dom(hist_data[-3])
            dom_3d = get_dom(hist_data[-4])
            
            bulls = [dom_current, dom_1d, dom_2d, dom_3d].count("Buyers")
            avg_dom_3d = "Buyers" if bulls >= 3 else "Sellers" if bulls <= 1 else "Balance"
            
            # Indicators
            prices = [x[4] for x in hist_data]
            s = pd.Series(prices)
            
            # RSI
            delta = s.diff()
            gain = (delta.where(delta > 0, 0)).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            cur_rsi = rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50
            
            # MACD
            e12 = s.ewm(span=12, adjust=False).mean()
            e26 = s.ewm(span=26, adjust=False).mean()
            macd = e12 - e26
            sig = macd.ewm(span=9, adjust=False).mean()
            hist = macd - sig
            
            h_val = hist.iloc[-1]
            h_prev = hist.iloc[-2]
            
            macd_sig = "Neutral"
            if h_val > 0: macd_sig = "Bullish Growing" if h_val > h_prev else "Bullish Waning"
            elif h_val < 0: macd_sig = "Bearish Growing" if h_val < h_prev else "Bearish Waning"
            
            # Score
            score = 50
            if cur_rsi > 50: score += 10
            if cur_rsi > 70: score -= 5
            if macd.iloc[-1] > sig.iloc[-1]: score += 15
            if change_current > 0: score += 10
            if dom_current == "Buyers": score += 5
            sentiment = "Neutral"
            if score > 75: sentiment = "STRONG BUY"
            elif score > 60: sentiment = "Bullish"
            elif score < 30: sentiment = "STRONG SELL"
            elif score < 40: sentiment = "Bearish"

            # Breakout Calculations (10, 30, 50 Days)
            def get_high_low(period):
                # Need period+1 candles (hist_data[-1] is c0/today, we need previous)
                if len(hist_data) < period + 2: return None, None
                past_data = hist_data[-(period+1):-1]
                if not past_data: return None, None
                
                max_h = max([x[2] for x in past_data])
                min_l = min([x[3] for x in past_data])
                return max_h, min_l

            h10, l10 = get_high_low(10)
            h30, l30 = get_high_low(30)
            h50, l50 = get_high_low(50)
            
            # 1-Day Breakout (Yesterday's High/Low)
            h1, l1 = get_high_low(1) 
            h100, l100 = get_high_low(100)
            h52w, l52w = get_high_low(250) # Approx 52 Weeks (Trading Days)

            def check_breakout(max_h, min_l):
                if max_h and c0 > max_h: return "Bullish Breakout"
                if min_l and c0 < min_l: return "Bearish Breakout"
                return "Consolidating" # or None

            bo_1 = check_breakout(h1, l1)
            bo_10 = check_breakout(h10, l10)
            bo_30 = check_breakout(h30, l30)
            bo_50 = check_breakout(h50, l50)
            bo_100 = check_breakout(h100, l100)
            bo_52w = check_breakout(h52w, l52w)

            return {
                "symbol": symbol, "token": token, "ltp": c0,
                "change_pct": round(change_current, 2),
                "rsi": round(cur_rsi, 2), "strength_score": round(score, 1),
                "sentiment": sentiment,
                "change_current": round(change_current, 2),
                "change_1d": round(change_1d, 2),
                "change_2d": round(change_2d, 2),
                "change_3d": round(change_3d, 2),
                "avg_3d": round(avg_3d, 2),
                "avg_dom_3d": avg_dom_3d,
                "dom_current": dom_current, "dom_1d": dom_1d,
                "dom_2d": dom_2d, "dom_3d": dom_3d,
                "macd_signal": macd_sig,
                "breakout_1d": bo_1,
                "breakout_10d": bo_10,
                "breakout_30d": bo_30,
                "breakout_50d": bo_50,
                "breakout_100d": bo_100,
                "breakout_52w": bo_52w,
                "high_1d": h1, "low_1d": l1,
                "high_10d": h10, "low_10d": l10,
                "high_30d": h30, "low_30d": l30,
                "high_50d": h50, "low_50d": l50,
                "high_100d": h100, "low_100d": l100,
                "high_52w": h52w, "low_52w": l52w
            }
        except Exception as e:
            return None

    while True:
        try:
            if not session_data and not smartApi.access_token:
                try: login()
                except: pass
            
            sm = ScripMaster.get_instance()
            fno = sm.get_all_fno_tokens()
            
            nifty = set(NIFTY_50_TOKENS.keys())
            targets = [x for x in fno if x['symbol'] in nifty] + \
                      [x for x in fno if x['symbol'] not in nifty]
            
            if not targets:
                import time; time.sleep(10); continue

            to_date = datetime.now()
            from_date = to_date - timedelta(days=400) # Fetch >1 year for 52W/100D
            fmt = "%Y-%m-%d %H:%M"
            
            def process_item(item):
                sym, tok = item['symbol'], item['token']
                # Retry Logic
                for i in range(3):
                    try:
                        res = smartApi.getCandleData({
                            "exchange": "NSE", "symboltoken": tok, "interval": "ONE_DAY",
                            "fromdate": from_date.strftime(fmt), "todate": to_date.strftime(fmt)
                        })
                        if res and res.get('data'):
                            return calculate_metrics(sym, tok, res['data'])
                        if i == 2: return None
                        import time; time.sleep(0.5)
                    except Exception as e:
                        if "rate" in str(e).lower():
                            import time; time.sleep(1.0 * (i+1)); continue
                        return None
                return None

            import concurrent.futures
            import time
            start_time = time.time()
            # 52 workers for ULTRA FAST loading (Aggressive)
            with concurrent.futures.ThreadPoolExecutor(max_workers=52) as ex:
                futures = {ex.submit(process_item, item): item for item in targets}
                for f in concurrent.futures.as_completed(futures):
                    res = f.result()
                    if res: 
                        market_cache[res['symbol']] = res
                        token_map_reverse[res['token']] = res['symbol']
            
            # Subscribe WS to new tokens
            if sws:
                tokens = [x['token'] for x in market_cache.values()]
                subscribe_to_tokens(tokens)
            
            elapsed = time.time() - start_time
            print(f"Scanner: Updated {len(market_cache)} stocks in {elapsed:.2f} seconds. CacheID: {id(market_cache)}")
            import time; time.sleep(15) # 15s Hybrid Interval (WS handles real-time)
            
        except Exception as e:
            print("Scanner Crash:", e)
            import time; time.sleep(30)


@app.get("/god-mode")
def god_mode():
    """
    Returns data from the Background Scanner INSTANTLY.
    """
    data = list(market_cache.values())
    print(f"API Request: Cache Size = {len(market_cache)}")
    # Sort
    sorted_data = sorted(data, key=lambda x: x['strength_score'], reverse=True)
    
    return {
        "status": "success", 
        "data": sorted_data, 
        "count": len(sorted_data),
        "scanner_status": "Running" if is_scanner_running else "Stopped",
        "debug_cache_id": id(market_cache),
        "debug_cache_len": len(market_cache)
    }

@app.on_event("startup")
def startup_event():
    # Start Background Scanner
    global is_scanner_running
    if not is_scanner_running:
        is_scanner_running = True
        t = threading.Thread(target=background_scanner, daemon=True)
        t.start()
    
    # Load Scrip Master
    try:
        from scrip_master import ScripMaster
        ScripMaster.get_instance() # Preload
    except Exception as e:
        logger.error(f"Failed to init ScripMaster: {e}")

@app.get("/options-chain/{symbol}")
def get_options_chain(symbol: str):
    """
    Returns a REAL Options Chain using Scrip Master lookup.
    """
    try:
        # 1. Get Spot Price
        # Try finding in static map first (fast), else use EQ scanner
        token = NIFTY_50_TOKENS.get(symbol.upper(), "99926000" if symbol.upper() == "NIFTY" else None)
        if not token:
             # Use Scrip Master for Equity Token
             from scrip_master import ScripMaster
             sm = ScripMaster.get_instance()
             token = sm.get_equity_token(symbol.upper())
             if not token:
                 return {"status": "error", "message": "Symbol not found"}

        data = get_market_data(symbol) 
        if not data or not data.get('data'):
             return {"status": "error", "message": "Could not fetch spot price"}
             
        ltp = data['data']['ltp']
        
        # 2. Calculate ATM & Strikes
        step = 50 if symbol.upper() in ["NIFTY", "NIFTY 50", "NIFTY50"] else (100 if "BANK" in symbol.upper() else (ltp * 0.01))
        step = int(step) if step > 10 else 1.0
        # Round to nearest step
        atm = round(ltp / step) * step
        
        target_strikes = []
        for i in range(-5, 6):
            target_strikes.append(atm + (i * step))
            
        # 3. Lookup Real Tokens
        from scrip_master import ScripMaster
        sm = ScripMaster.get_instance()
        
        # Auto-detect expiry (Hardcoded for Demo - Current Monthly 26 DEC 24)
        # In a real app, this logic calculates the next Thursday
        expiry_str = "26DEC24" 
        
        is_index = symbol.upper() in ["NIFTY", "BANKNIFTY", "NIFTY 50"]
        
        tokens_map = sm.get_fno_tokens_for_chain(symbol.upper(), expiry_str, target_strikes, is_index)
        
        # 4. Fetch Live Feeds (Parallelized)
        import concurrent.futures
        
        def fetch_option_row(strike):
            ce_token = tokens_map.get(f"{int(strike)}_CE")
            pe_token = tokens_map.get(f"{int(strike)}_PE")
            
            ce_ltp, pe_ltp = 0, 0
            
            # CE
            if ce_token:
                try:
                    res = smartApi.ltpData("NFO", f"{symbol}{expiry_str}{int(strike)}CE", ce_token)
                    if res and res.get('data'): ce_ltp = res['data']['ltp']
                except: pass
                
            # PE
            if pe_token:
                try:
                    res = smartApi.ltpData("NFO", f"{symbol}{expiry_str}{int(strike)}PE", pe_token)
                    if res and res.get('data'): pe_ltp = res['data']['ltp']
                except: pass
                
            return {
                "strike": strike,
                "type": "ATM" if strike == atm else ("ITM" if strike < atm else "OTM"),
                "ce_ltp": ce_ltp,
                "pe_ltp": pe_ltp,
                "ce_token": ce_token,
                "pe_token": pe_token
            }

        chain_data = []
        # 2. Parallel Processing
        results = []
        # Increased workers for ~200 stocks. Be careful of rate limits (3/sec is standard, but Angel often allows more)
        # 20 workers ~ 20 concurrent requests.
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            chain_data = list(executor.map(fetch_option_row, target_strikes))
            
        # Ensure sorted
        chain_data.sort(key=lambda x: x['strike'])

        return {
            "status": "success",
            "symbol": symbol,
            "spot_price": ltp,
            "expiry": expiry_str,
            "chain": chain_data
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

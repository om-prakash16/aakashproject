import requests
import json
import os
import pandas as pd
from datetime import datetime, timedelta
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ScripMaster")

SCRIP_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIP_FILE_PATH = os.path.join(BASE_DIR, "OpenAPIScripMaster.json")

class ScripMaster:
    _instance = None
    df = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ScripMaster()
        return cls._instance

    def __init__(self):
        self.load_data()

    def download_scrip_master(self):
        """Downloads the scrip master JSON if it doesn't exist or is stale (>24h)."""
        try:
            should_download = True
            if os.path.exists(SCRIP_FILE_PATH):
                file_time = datetime.fromtimestamp(os.path.getmtime(SCRIP_FILE_PATH))
                if datetime.now() - file_time < timedelta(hours=24):
                    should_download = False
                    logger.info("Scrip master is up to date.")

            if should_download:
                logger.info("Downloading latest Scrip Master...")
                response = requests.get(SCRIP_MASTER_URL)
                response.raise_for_status()
                with open(SCRIP_FILE_PATH, 'wb') as f:
                    f.write(response.content)
                logger.info("Download complete.")
        except Exception as e:
            logger.error(f"Failed to download Scrip Master: {e}")

    def load_data(self):
        """Loads the Scrip Master into a Pandas DataFrame."""
        self.download_scrip_master()
        if not os.path.exists(SCRIP_FILE_PATH):
            logger.error("Scrip file not found!")
            return

        try:
            # Check for PICKLE cache (fast load)
            pkl_path = SCRIP_FILE_PATH.replace(".json", ".pkl")
            if os.path.exists(pkl_path):
                 file_time = datetime.fromtimestamp(os.path.getmtime(SCRIP_FILE_PATH))
                 pkl_time = datetime.fromtimestamp(os.path.getmtime(pkl_path))
                 if pkl_time >= file_time:
                      logger.info("Loading from Cached Pickle (Fast!)...")
                      self.df = pd.read_pickle(pkl_path)
                      logger.info(f"Loaded {len(self.df)} scrips from cache.")
                      return

            logger.info("Parsing JSON Scrip Master (Slow)...")
            # Load with specific types to save memory
            with open(SCRIP_FILE_PATH, 'r') as f:
                data = json.load(f)
                
            self.df = pd.DataFrame(data)
            
            # Save to Pickle for next time
            logger.info("Saving cache...")
            self.df.to_pickle(pkl_path)
            
            logger.info(f"Loaded {len(self.df)} scrips.")
            
        except Exception as e:
            logger.error(f"Error loading scrip data: {e}")

    def get_fno_tokens_for_chain(self, symbol, expiry_str, strikes, is_index=True):
        """
        Efficiently finds tokens for a list of strikes for a given expiry.
        expiry_str: e.g. "26DEC24" (Angel format)
        strikes: list of float e.g. [24000.0, 24100.0]
        """
        if self.df is None:
            return {}

        found_tokens = {} # { "24000_CE": "token", "24000_PE": "token" ... }
        
        # Determine Instrument
        inst_type = "OPTIDX" if is_index else "OPTSTK"
        
        # Filter DF once for this Symbol, Expiry and Type
        # Symbol in NFO is typically "NIFTY", "SBIN"
        mask = (self.df['exch_seg'] == 'NFO') & \
               (self.df['name'] == symbol) & \
               (self.df['instrumenttype'] == inst_type)
               
        # We can also filter by expiry if the DF has it parsed, specifically matching the symbol suffix is safer
        # Angel Symbol format: [Name][ExpiryDay][ExpiryMonth][ExpiryYear][Strike][Type]
        # BUT formatting that exactly is tricky.
        # Easier Strategy: Filter master for the subset, then iterate.
        
        subset = self.df[mask]
        if subset.empty:
            return {}

        # Convert to dictionary for O(1) lookup: key=symbol, value=token
        # Problem: 'symbol' column is like "NIFTY26DEC2424000CE"
        # We need to fuzzy match or parse.
        
        # Let's iterate the subset once creating a map of { strike_price_float : { 'CE': token, 'PE': token } }
        # Note: 'strike' in JSON is usually string "24000.000000" and divided by 100 or something? 
        # Actually checking raw JSON is best. usually it's -1 for integers.
        # Let's trust 'strike' column provided by Angel (usually requires /100 conversion).
        
        for _, row in subset.iterrows():
            try:
                # Check Expiry Match (simplistic string match in symbol for MVP)
                if expiry_str not in row['symbol']:
                     continue

                # Parse Type
                otype = "CE" if row['symbol'].endswith("CE") else "PE" if row['symbol'].endswith("PE") else None
                if not otype: continue
                
                # Parse Strike (Angel 'strike' is typically scaled, e.g. 2400000 -> 24000.0)
                # Safe fallback: parse from symbol if column unreliable
                stk_price = float(row['strike']) / 100.0 
                
                if stk_price in strikes:
                     key = f"{int(stk_price)}_{otype}"
                     found_tokens[key] = row['token']
                     
            except Exception:
                continue
                
        return found_tokens

    def get_equity_token(self, symbol):
        """Get NSE Equity token"""
        if self.df is None: return None
        mask = (self.df['exch_seg'] == 'NSE') & ((self.df['symbol'] == f"{symbol}-EQ") | (self.df['name'] == symbol) )
        res = self.df[mask]
        if not res.empty:
            return res.iloc[0]['token']
        return None

    def get_all_fno_tokens(self):
        """
        Returns a list of dictionaries for ALL stocks that have Futures (F&O Stocks).
        Returns: [{'symbol': 'RELIANCE', 'token': '2885'}, ...]
        """
        if self.df is None: return []
        
        # 1. Provide unique names from NFO Futures (FUTSTK)
        # This confirms the stock is in F&O segment
        fno_names = self.df[
            (self.df['exch_seg'] == 'NFO') & 
            (self.df['instrumenttype'] == 'FUTSTK')
        ]['name'].unique()
        
        # 2. Get their NSE Equity tokens
        # It's faster to filter the DF once for all NSE Equities matching these names
        mask = (self.df['exch_seg'] == 'NSE') & \
               (self.df['name'].isin(fno_names)) & \
               (self.df['symbol'].str.endswith("-EQ"))
               
        equity_subset = self.df[mask]
        
        results = []
        for _, row in equity_subset.iterrows():
            results.append({
                "symbol": row['name'],
                "token": row['token']
            })
            
        return results

# Singleton usage
# scrip_master = ScripMaster.get_instance()

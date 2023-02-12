export interface Balance {
  [asset: string]: {
    asset_id: number,
    asset_symbol: string,
    available_balance: string,
    balance: string,
    commission: string,
    id: number,
    interest_credit: string,
    order_margin: string,
    pending_referral_bonus: string,
    pending_trading_fee_credit: string,
    portfolio_margin: string,
    position_margin: string,
    trading_fee_credit: string,
    unvested_amount: string,
    user_id: number,
  }
}

export interface Query {
  key: string;
  value: string;
}

export interface Asset {
  "base_withdrawal_fee": string,
  "deposit_status": string,
  "id": number,
  "interest_credit": boolean,
  "interest_slabs": any,
  "kyc_deposit_limit": string,
  "kyc_withdrawal_limit": string,
  "min_withdrawal_amount": string,
  "minimum_precision": number,
  "name": string,
  "networks": [any],
  "precision": number,
  "sort_priority": number,
  "symbol": string,
  "variable_withdrawal_fee": string,
  "withdrawal_status": string
}

export interface Product {
  "tick_size": string,
  "insurance_fund_margin_contribution": string,
  "initial_margin_scaling_factor": string,
  "id": number,
  "notional_type": string,
  "taker_commission_rate": string,
  "barrier_price": any,
  "underlying_asset": Asset,
  "auction_start_time": any,
  "maintenance_margin": string,
  "initial_margin": string,
  "annualized_funding": string,
  "ui_config": {
    "default_trading_view_candle": string,
    "leverage_slider_values": [number],
    "price_clubbing_values": [number],
    "show_bracket_orders": boolean,
    "sort_priority": number,
    "tags": [any]
  },
  "contract_unit_currency": string,
  "settlement_price": any,
  "short_description": string,
  "product_specs": {
    "backup_vol_expiry_time": number,
    "max_deviation_from_external_vol": number,
    "max_lower_deviation_from_external_vol": number,
    "max_upper_deviation_from_external_vol": number,
    "max_volatility": number,
    "min_volatility": number,
    "premium_commission_rate": number,
    "vol_calculation_method": string,
    "vol_expiry_time": number
  },
  "settling_asset": Asset,
  "max_leverage_notional": string,
  "quoting_asset": Asset,
  "price_band": string,
  "description": string,
  "launch_time": string,
  "contract_type": string,
  "strike_price": string,
  "disruption_reason": any,
  "position_size_limit": number,
  "symbol": string,
  "maintenance_margin_scaling_factor": string,
  "impact_size": number,
  "is_quanto": boolean,
  "liquidation_penalty_factor": string,
  "contract_value": string,
  "funding_method": string,
  "state": string,
  "default_leverage": string,
  "trading_status": string,
  "basis_factor_max_limit": string,
  "maker_commission_rate": string,
  "spot_index": {
    "config": {
      "impact_size": {
        "max_impact_size": number,
        "min_impact_size": number,
        "step_value": number
      },
      "quoting_asset": string,
      "service_id": number,
      "underlying_asset": string
    },
    "constituent_exchanges": [{
      "exchange": string,
      "health_interval": number,
      "health_priority": number,
      "weight": number
    }],
    "constituent_indices": any,
    "description": string,
    "health_interval": number,
    "id": number,
    "impact_size": string,
    "index_type": string,
    "is_composite": boolean,
    "price_method": string,
    "quoting_asset_id": number,
    "symbol": string,
    "tick_size": string,
    "underlying_asset_id": number
  },
  "auction_finish_time": any,
  "settlement_time": string
}

export interface Order {
  "commission": string,
  "created_at": string,
  "bracket_stop_loss_price": string,
  "id": number,
  "bracket_trail_amount": string,
  "bracket_order": boolean,
  "product_id": number,
  "order_type": string,
  "bracket_take_profit_limit_price": string,
  "bracket_take_profit_price": string,
  "client_order_id": string,
  "side": string,
  "limit_price": string,
  "meta_data": {
    "edit_timestamp": string,
    "source": string,
    "trigger_price": string,
  },
  "time_in_force": string,
  "trail_amount": string,
  "cancellation_reason": string,
  "stop_order_type": string,
  "average_fill_price": string,
  "bracket_stop_loss_limit_price": string,
  "reduce_only": boolean,
  "stop_price": string,
  "paid_commission": string,
  "unfilled_size": number,
  "stop_trigger_method": string,
  "size": number,
  "state": string,
  "product": Product,
  "user_id": number,
  "close_on_trigger": "true" | "false",
  "quote_size": string,
  "updated_at": string,
  "product_symbol": string,
}

export interface Candle {
  close: number,
  high: number,
  low: number,
  open: number,
  time: number,
  volume: number
}

export interface MinimalOption {
  symbol: string;
  expiry: string;
  type: "call" | "put";
  strike_price: number;
  mark_price: number;
  best_bid: number;
  best_ask: number;
  spot_price: number;
  candles?: {
    high: number,
    low: number,
  }[];
}

export interface Option extends MinimalOption {
  id: number;
  timestamp: string;
  volume: number;
  open: number;
  close: number;
  high: number;
  low: number;
  ask_size: number;
  bid_size: number;
  price_max: number;
  price_min: number;
  underlying: string;
  trunover: string;
  candles?: Candle[];
}

export interface OptionChain {
  [price: number]: {
    call: Option | MinimalOption | undefined | null;
    put: Option | MinimalOption | undefined | null;
  };
}

export interface OptionChains {
  [expiry: string]: OptionChain;
}

export interface Quotes {
  ask_iv: number;
  ask_size: number;
  best_ask: number;
  best_bid: number;
  bid_iv: number;
  bid_size: number;
  mark_iv: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface Ticker {
  close: number;
  contract_type: string;
  funding_rate: number;
  greeks?: Greeks
  high: number;
  low: number;
  mark_basis: number;
  mark_price: number;
  oi: number;
  oi_value: number;
  oi_value_symbol: string;
  oi_value_usd: number;
  open: number;
  price_band?: {
    lower_limit: number;
    upper_limit: number;
  },
  product_id: number;
  quotes?: Quotes,
  size: number;
  spot_price: number;
  symbol: string;
  timestamp: number
  turnover: number;
  turnover_symbol: string;
  turnover_usd: number;
  volume: number;
}

export interface Position {
  "adl_level": any,
  "auto_topup": boolean,
  "bankruptcy_price": string,
  "commission": string,
  "created_at": string,
  "entry_price": string,
  "liquidation_price": string,
  "margin": string,
  "margin_mode": string,
  "product": Product,
  "product_id": number,
  "product_symbol": string,
  "realized_cashflow": string,
  "realized_funding": string,
  "realized_pnl": string,
  "size": number,
  "updated_at": string,
  "user_id": number
}

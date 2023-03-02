import {
  CloseOnTrigger,
  Method,
  MMP,
  OrderType,
  PostOnly,
  ReduceOnly,
  Side,
  StopOrderType,
  StopTriggerMethod,
  TimeInForce
} from "../DeltaExchangeConstants";

export interface Query {
  key: string
  value: string
}

export interface RequestPayload {
  [key: string]: string | number | boolean | RequestPayload | undefined
}

export interface DeltaExchangeRequest {
  path: string
  base_url?: string
  method?: Method
  auth?: boolean
  headers?: HeadersInit
  payload?: RequestPayload
  queries?: Query[]
}

export interface CreateOrderRequest {
  product_id: number
  limit_price?: string
  size?: number
  // side for which to place order
  side?: Side
  order_type?: OrderType
  stop_order_type?: StopOrderType
  stop_price?: string
  trail_amount?: string
  stop_trigger_method?: StopTriggerMethod
  bracket_stop_loss_limit_price?: string
  bracket_stop_loss_price?: string
  bracket_take_profit_limit_price?: string
  bracket_take_profit_price?: string
  time_in_force?: TimeInForce
  mmp?: MMP
  post_only?: PostOnly
  reduce_only?: ReduceOnly
  close_on_trigger?: CloseOnTrigger
  client_order_id?: string
}

export interface EditOrderRequest {
  id?: number
  product_id?: number
  limit_price?: string
  // total size after editing order
  size?: Side
  mmp?: MMP
}

export interface CreateBracketOrderRequest {
  product_id?: number
  stop_loss_order?: {
    order_type?: OrderType
    stop_price?: string
    // Use trail amount if you want a trailing stop order. Required if stop price is empty.
    trail_amount?: string
    // Required if its a limit order
    limit_price?: string
  }
  take_profit_order?: {
    order_type?: OrderType
    stop_price?: string
    // Required if its a limit order
    limit_price?: string
  }
  stop_trigger_method?: StopTriggerMethod
}

export interface StopOrderRequest {
  product_id: number
  limit_price?: string
  size?: number
  // side for which to place order
  side?: Side
  order_type?: OrderType
  stop_order_type?: StopOrderType
  stop_price?: string
  trail_amount?: string
  stop_trigger_method?: StopTriggerMethod
  time_in_force?: TimeInForce
  mmp?: MMP
  post_only?: PostOnly
  reduce_only?: ReduceOnly
  close_on_trigger?: CloseOnTrigger
  client_order_id?: string
}

export interface LimitOrderRequest {
  product_id: number
  limit_price?: string
  size?: number
  // side for which to place order
  side?: Side
  order_type?: OrderType
  stop_order_type?: StopOrderType
  stop_price?: string
  trail_amount?: string
  stop_trigger_method?: StopTriggerMethod
  time_in_force?: TimeInForce
  mmp?: MMP
  post_only?: PostOnly
  reduce_only?: ReduceOnly
  close_on_trigger?: CloseOnTrigger
  client_order_id?: string
}

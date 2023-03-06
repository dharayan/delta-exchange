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

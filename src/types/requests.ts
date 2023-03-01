import {Method} from "../DeltaExchangeConstants";

export interface Query {
  key: string
  value: string
}

export interface RequestPayload {
  [key: string]: string | number | boolean | undefined
}

export interface RequestInput {
  path: string
  base_url?: string
  method?: Method
  auth?: boolean
  headers?: HeadersInit
  payload?: RequestPayload
  queries?: Query[]
}

export interface OrderInput {
  // required
  product_id: number,
  side: string,
  size: number,
  order_type: string,
  limit_price?: number,
  // bracket order
  bracket_order?: boolean,
  bracket_stop_loss_trigger_price?: number,
  bracket_stop_loss_limit_price?: number,
  bracket_take_profit_trigger_price?: number,
  bracket_take_profit_limit_price?: number,
  bracket_trail_amount?: number,
  // stop/limit order
  stop_order_type?: string,
  stop_price?: number,
  stop_trigger_method?: string,
  trail_amount?: number,
  // other details
  close_on_trigger?: boolean,
  client_order_id?: string,
  time_in_force?: string,
  reduce_only?: boolean,
  post_only?: boolean,
}

export interface BracketOrderInput {
  // required
  product_id: number,
  side: string,
  size: number,
  order_type: string,
  limit_price?: number,
  // bracket order
  bracket_order?: boolean,
  bracket_stop_loss_limit_price?: number,
  bracket_stop_loss_trigger_price?: number,
  bracket_take_profit_limit_price?: number,
  bracket_take_profit_trigger_price?: number,
  bracket_trail_amount?: number,
  stop_trigger_method?: string,
  // other details
  close_on_trigger?: boolean,
  client_order_id?: string,
  time_in_force?: string,
  reduce_only?: boolean,
  post_only?: boolean,
}

export interface StopOrderInput {
  // required
  product_id: number,
  side: string,
  size: number,
  order_type: string,
  stop_price: number,
  // stop/limit order
  limit_price?: number,
  trail_amount?: number,
  stop_trigger_method?: string,
  // other details
  close_on_trigger?: boolean,
  post_only?: boolean,
  client_order_id?: string,
  time_in_force?: string
}

export interface LimitOrderInput {
  // required
  product_id: number,
  side: string,
  size: number,
  order_type: string,
  limit_price?: number,
  // stop order
  stop_order_type?: string,
  stop_price?: number,
  stop_trigger_method?: string,
  trail_amount?: number,
  // other details
  close_on_trigger?: boolean,
  client_order_id?: string,
  time_in_force?: string,
  reduce_only?: boolean,
  post_only?: boolean,
}

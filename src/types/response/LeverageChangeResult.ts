interface resultType {
  leverage: string
  margin_mode: string
  order_margin: string
  product_id: number
}

export interface LeverageChangeResult {
  result: resultType
  success: boolean
}

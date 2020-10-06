import { types } from 'cassandra-driver'

export type Record = {
  id?: any
  timestamp?: number
}

export interface Row extends types.Row {}
export interface ResultSet extends types.ResultSet {}

export type Column = { name: string; type: { code: number; info: any } }

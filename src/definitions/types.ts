import { types } from 'cassandra-driver'

export type Identity = string

export type Record = {
  id?: Identity
  timestamp?: number
}

export interface Row extends types.Row {}
export interface ResultSet extends types.ResultSet {}

export type Column = { name: string; type: { code: number; info: any } }

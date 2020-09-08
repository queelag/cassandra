import { types } from 'cassandra-driver'

export type Record = {
  id?: string
}

export interface Row extends types.Row {}
export interface ResultSet extends types.ResultSet {}

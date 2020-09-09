import { metadata, types } from 'cassandra-driver'

export type Record = {
  id?: string
  timestamp?: number
}

export interface Row extends types.Row {}
export interface ResultSet extends types.ResultSet {}
export interface ColumnInfo extends metadata.ColumnInfo {}

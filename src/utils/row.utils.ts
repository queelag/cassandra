import { types } from 'cassandra-driver'
import { camelCase, reduce } from 'lodash'
import { ColumnInfo, Row } from '../definitions/types'
import ColumnUtils from './column.utils'

class RowUtils {
  static toRecord<T>(columns: ColumnInfo[], row: Row): T {
    return this.reduceToSimpleTypes(
      columns,
      reduce(row ? row.keys() : [], (r: T, k: string) => ({ ...r, [k]: row.get(k) }), {} as T)
    )
  }

  static toRecords<T>(columns: ColumnInfo[], rows: Row[]): T[] {
    return reduce(rows, (r: T[], v: Row) => [...r, this.toRecord(columns, v)], [])
  }

  static reduceToSimpleTypes<T extends object>(columns: ColumnInfo[], v: T, root: string[] = []): T {
    return reduce(
      v,
      (r: T, v: any, k: string) => {
        let key: string, type: number

        key = camelCase(k)
        type = ColumnUtils.findTypeByPath(columns, root.concat(k))

        switch (true) {
          case type === 12:
            r[key] = (v as types.Uuid).toString()
            break
          case type === 16:
            r[key] = (v as types.InetAddress).toString()
            break
          case type === 11:
            r[key] = (v as Date).valueOf()
            break
          case type === 34:
            r[key] = Object.values(this.reduceToSimpleTypes<T>(columns, v, root.concat(k)))
            break
          case type === 48:
            r[key] = this.reduceToSimpleTypes<T>(columns, v, root.concat(k))
            break
          default:
            r[key] = v
            break
        }

        return r
      },
      {} as T
    )
  }
}

export default RowUtils

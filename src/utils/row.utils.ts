import { types } from 'cassandra-driver'
import { camelCase, reduce } from 'lodash'
import { DataType } from '../definitions/enums'
import { Column, Row } from '../definitions/types'
import Regex from '../modules/regex'
import ColumnUtils from './column.utils'

class RowUtils {
  static toRecord<T>(columns: Column[], row: Row): T {
    return this.reduceToSimpleTypes(
      columns,
      reduce(row ? row.keys() : [], (r: T, k: string) => ({ ...r, [k]: row.get(k) }), {} as T)
    )
  }

  static toRecords<T>(columns: Column[], rows: Row[]): T[] {
    return reduce(rows, (r: T[], v: Row) => [...r, this.toRecord(columns, v)], [])
  }

  static reduceToSimpleTypes<T extends object>(columns: Column[], v: T, root: string[] = []): T {
    return reduce(
      v,
      (r: T, v: any, k: string) => {
        let key: string, type: number

        key = Regex.snake.test(k) ? camelCase(k) : k
        type = ColumnUtils.findTypeByPath(columns, root.concat(k))

        switch (true) {
          case type === DataType.UUID:
            r[key] = (v as types.Uuid).toString()
            break
          case type === DataType.INET:
            r[key] = (v as types.InetAddress).toString()
            break
          case type === DataType.TIMESTAMP:
            r[key] = (v as Date).valueOf()
            break
          case type === DataType.LIST:
          case type === DataType.SET:
            r[key] = Object.values(this.reduceToSimpleTypes<T>(columns, v, root.concat(k)))
            break
          case type === DataType.UDT:
          case type === DataType.MAP:
            r[key] = this.reduceToSimpleTypes<T>(columns, v, root.concat(k))
            break
          default:
            r[key] = v
            break
        }

        if (r[key] === null) delete r[key]

        return r
      },
      {} as T
    )
  }
}

export default RowUtils

import { types } from 'cassandra-driver'
import { camelCase, isPlainObject, reduce } from 'lodash'
import { Row } from '../definitions/types'

class RowUtils {
  static toRecord<T>(row: Row): T {
    return this.reduceToSimpleTypes(reduce(row ? row.keys() : [], (r: T, k: string) => ({ ...r, [k]: row.get(k) }), {} as T))
  }

  static toRecords<T>(rows: Row[]): T[] {
    return reduce(rows, (r: T[], v: Row) => [...r, this.toRecord(v)], [])
  }

  static reduceToSimpleTypes<T extends object>(v: T): T {
    return reduce(
      v,
      (r: T, v: any, k: string) => {
        k = camelCase(k)

        switch (true) {
          case v instanceof types.Uuid:
            r[k] = (v as types.Uuid).toString()
            break
          case v instanceof types.InetAddress:
            r[k] = (v as types.InetAddress).toString()
            break
          case v instanceof Date:
            r[k] = (v as Date).valueOf()
            break
          case v instanceof Array:
            r[k] = Object.values(this.reduceToSimpleTypes<T>(v))
            break
          case isPlainObject(v):
            r[k] = this.reduceToSimpleTypes<T>(v)
            break
          default:
            r[k] = v
            break
        }

        return r
      },
      {} as T
    )
  }
}

export default RowUtils

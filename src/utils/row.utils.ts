import { types } from 'cassandra-driver'
import { reduce } from 'lodash'
import { Row } from '../definitions/types'

class RowUtils {
  static toRecord<T>(row: Row): T {
    return reduce(
      row ? row.keys() : [],
      (r: T, k: string) => {
        let v: any

        v = row.get(k)

        switch (true) {
          case v instanceof types.TimeUuid:
            r[k] = v.toString()
            break
          default:
            r[k] = v
        }

        return r
      },
      {} as T
    )
  }

  static toRecords<T>(rows: Row[]): T[] {
    return reduce(rows, (r: T[], v: Row) => [...r, this.toRecord(v)], [])
  }
}

export default RowUtils

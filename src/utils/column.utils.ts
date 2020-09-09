import { get, has } from 'lodash'
import { ColumnInfo } from '../definitions/types'

class ColumnUtils {
  static findTypeByPath(columns: ColumnInfo[], keys: string[]): number {
    let column: ColumnInfo

    keys.forEach((k: string) => {
      switch (true) {
        case has(column, 'type.info.fields'):
          // @ts-ignore
          column = column.type.info.fields.find((v: ColumnInfo) => v.name === k)
          break
        default:
          column = columns.find((v: ColumnInfo) => v.name === k)
          break
      }
    })

    return get(column, 'type.code', 0)
  }
}

export default ColumnUtils

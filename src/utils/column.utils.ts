import { get, has, snakeCase } from 'lodash'
import { Column, Keys, Record } from '../definitions/types'
import Regex from '../modules/regex'

class ColumnUtils {
  static findTypeByPath(columns: Column[], keys: string[]): number {
    let column: Column

    keys.forEach((k: string) => {
      switch (true) {
        case has(column, 'type.info.fields'):
          column = column.type.info.fields.find((v: Column) => v.name === k)
          break
        case has(column, 'type.info.code') && Regex.number.test(k):
          column = { ...column, type: { ...column.type, code: column.type.info.code } }
          break
        case has(column, 'type.info.info.fields'):
          column = column.type.info.info.fields.find((v: Column) => v.name === k)
          break
        default:
          column = columns.find((v: Column) => v.name === k)
          break
      }
    })

    return get(column, 'type.code', 0)
  }

  static toSnakeCase<T extends Record>(v: Keys<T>): string[] {
    return v.map((w: any) => (w === '*' ? w : snakeCase(w)))
  }
}

export default ColumnUtils

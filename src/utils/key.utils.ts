import { snakeCase } from 'lodash'
import { Key, Record } from '../definitions/types'

class KeyUtils {
  static toSnakeCase<T extends Record>(v: Key<T>[]): string[] {
    return v.map((w: any) => (w === '*' ? w : snakeCase(w)))
  }
}

export default KeyUtils

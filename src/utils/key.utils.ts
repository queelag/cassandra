import { snakeCase, uniq } from 'lodash'
import { Key, Record } from '../definitions/types'

class KeyUtils {
  static join<T extends Record>(v: Key<T>[]): string {
    return KeyUtils.toSnakeCase(v).join(',')
  }

  static toSnakeCase<T extends Record>(v: Key<T>[]): string[] {
    return v.includes('*') ? ['*'] : uniq(v.map((w: any) => snakeCase(w)).concat(['id', 'timestamp']))
  }
}

export default KeyUtils

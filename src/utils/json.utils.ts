import { camelCase, isArray, isPlainObject, reduce, snakeCase } from 'lodash'
import Regex from '../modules/regex'

class JSONUtils {
  static parse<T extends object>(v: string): T {
    return this.reduceToCamelCase<T>(JSON.parse(v))
  }

  static stringify<T extends object>(v: T): string {
    return JSON.stringify(this.reduceToSnakeCase<T>(v))
  }

  static reduceToCamelCase<T extends object>(v: T): T {
    return reduce(
      v,
      (r: T, v: any, k: string) => {
        k = Regex.snake.test(k) ? camelCase(k) : k

        switch (true) {
          case isArray(v):
            r[k] = Object.values(this.reduceToCamelCase<T>(v))
            break
          case isPlainObject(v):
            r[k] = this.reduceToCamelCase<T>(v)
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

  static reduceToSnakeCase<T extends object>(v: T): T {
    return reduce(
      v,
      (r: T, v: any, k: string) => {
        k = Regex.camel.test(k) ? snakeCase(k) : k

        switch (true) {
          case isArray(v):
            r[k] = Object.values(this.reduceToSnakeCase<T>(v))
            break
          case isPlainObject(v):
            r[k] = this.reduceToSnakeCase(v)
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

export default JSONUtils

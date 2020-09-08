import { camelCase, isPlainObject, reduce, snakeCase } from 'lodash'

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
        k = camelCase(k)

        switch (true) {
          case isPlainObject(v):
            r[k] = this.reduceToCamelCase(v)
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
        k = snakeCase(k)

        switch (true) {
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

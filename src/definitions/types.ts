import { types } from 'cassandra-driver'

// type Join<K, P> = K extends string | number ?
//     P extends string | number ?
//     `${K}${"" extends P ? "" : "."}${P}`
//     : never : never

// type Previous = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//       11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

// type MongoDotPaths<T, D extends number = 10> = [D] extends [never]
//   ? never
//   : T extends object
//     ? { [K in keyof T]: K extends string | number
//       ? T[K] extends (infer A)[]
//         ? `${K}` | Join<K, MongoDotPaths<A, Previous[D]>>
//         : T[K] extends string | number | bigint | symbol | boolean | {}
//           ? `${K}` | Join<K, MongoDotPaths<T[K], Previous[D]>>
//           : never
//       : never
//     }[keyof T]
//     : ''

export type Identity = string

export type Record = {
  id?: Identity
  timestamp?: number
}

export interface Row extends types.Row {}
export interface ResultSet extends types.ResultSet {}

export type Column = { name: string; type: { code: number; info: any } }

// export type Keys<T extends Record> = MongoDotPaths<T, 10>[] | ['*']
export type Keys<T extends Record> = keyof T | '*'

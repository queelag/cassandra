import AJV, { ValidateFunction } from 'ajv'
import { QueryOptions } from 'cassandra-driver'
import { get, some } from 'lodash'
import { deserialize, serialize } from 'v8'
import Cassandra from '..'
import { Status } from '../definitions/enums'
import { Identity, Keys, Path, Record, ResultSet } from '../definitions/types'
import Child from '../modules/child'
import clone from '../modules/clone'
import ID from '../modules/id'
import tcp from '../modules/tcp'
import ColumnUtils from '../utils/column.utils'
import JSONUtils from '../utils/json.utils'
import RowUtils from '../utils/row.utils'

class Table<T extends Record> extends Child {
  private readonly dummy: T
  private readonly name: string
  private status: Status

  public readonly validate: ValidateFunction

  constructor(cassandra: Cassandra, name: string, dummy: T, schema: object) {
    super(cassandra)

    this.dummy = dummy
    this.name = name
    this.status = Status.OFF

    this.validate = new AJV().compile(schema)

    this.cassandra.initialization().then(() => (this.status = Status.ON))
  }

  public async read<U = T>(id: Identity, keys: Keys<T> = ['*'], path?: Path<T>, options?: QueryOptions): Promise<U> {
    return this.find(`SELECT ${ColumnUtils.toSnakeCase(keys).join(',')} FROM ${this.name} WHERE id = ?`, [id], path, options)
  }

  public async all(keys: Keys<T> = ['*'], path?: Path<T>, options?: QueryOptions): Promise<T[]> {
    return this.filter(`SELECT ${ColumnUtils.toSnakeCase(keys).join(',')} FROM ${this.name}`, [], path, options)
  }

  public async find<U = T>(query: string, params?: any[], path?: Path<T>, options?: QueryOptions): Promise<U> {
    let result: ResultSet | Error, record: T

    result = await this.execute(query, params, { fetchSize: 1, ...options })
    if (result instanceof Error) return get(clone<T>(this.dummy), path, clone<T>(this.dummy))

    record = RowUtils.toRecord(result.columns, result.first())
    if (Object.keys(record).length <= 0) return get(clone<T>(this.dummy), path, clone<T>(this.dummy))

    return get(record, path, record)
  }

  public async filter<U = T>(query: string, params?: any[], path?: Path<T>, options?: QueryOptions): Promise<U[]> {
    let result: ResultSet | Error, records: U[]

    result = await this.execute(query, params, options)
    if (result instanceof Error) return []

    records = RowUtils.toRecords(result.columns, result.rows)
    records = records.map((v: U) => get(v, path, v))

    return records
  }

  public async write(data: T, options?: QueryOptions): Promise<Identity> {
    let clone: T, id: Identity | Error, result: ResultSet | Error

    clone = deserialize(serialize(data))
    delete clone.id
    delete clone.timestamp

    if (!this.validate(clone)) {
      console.error(this.validate.errors)
      return ''
    }

    id = data.id || (await ID.unique(this))
    if (id instanceof Error) return ''

    clone.id = id
    clone.timestamp = Date.now()

    result = await this.execute(`INSERT INTO ${this.name} JSON ?`, [JSONUtils.stringify(clone)], options)
    if (result instanceof Error) return ''

    return clone.id
  }

  public async unlink(id: Identity, options?: QueryOptions): Promise<boolean> {
    return this.delete(`DELETE FROM ${this.name} WHERE id = ?`, [id], options)
  }

  public async delete(query: string, params?: any[], options?: QueryOptions): Promise<boolean> {
    let result: ResultSet | Error

    result = await this.execute(query, params, options)
    if (result instanceof Error) return false

    return true
  }

  public async exists(id: Identity): Promise<boolean | Error> {
    let result: ResultSet | Error

    result = await this.execute(`SELECT id FROM ${this.name} WHERE id = ? LIMIT 1`, [id], { fetchSize: 1 })
    if (result instanceof Error) return result

    return result.first() !== null
  }

  public async count(query: string, params?: any[], options?: QueryOptions): Promise<number> {
    let result: ResultSet | Error

    result = await this.execute(query, params, options)
    if (result instanceof Error) return 0

    return (result.first().get('count') as Long).toNumber()
  }

  private async execute(query: string, params: any[] = [], options: QueryOptions = {}): Promise<ResultSet | Error> {
    return this.status === Status.ON
      ? some(params, (v: any) => (v.length ? v.length <= 0 : v === 0 ? false : v === false ? false : !v))
        ? new Error()
        : tcp(() => this.cassandra.client.execute(query, params, { prepare: true, ...options }))
      : new Error()
  }
}

export default Table

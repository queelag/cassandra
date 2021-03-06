import AJV, { ValidateFunction } from 'ajv'
import { QueryOptions } from 'cassandra-driver'
import { some } from 'lodash'
import { deserialize, serialize } from 'v8'
import Cassandra from '..'
import { Status } from '../definitions/enums'
import { Identity, Key, Record, ResultSet } from '../definitions/types'
import Child from '../modules/child'
import clone from '../modules/clone'
import ID from '../modules/id'
import tcp from '../modules/tcp'
import JSONUtils from '../utils/json.utils'
import KeyUtils from '../utils/key.utils'
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

  public async read(id: Identity, keys: Key<T>[] = ['*'], options?: QueryOptions): Promise<T> {
    return this.find(`SELECT ${KeyUtils.join(keys)} FROM ${this.name} WHERE id = ?`, [id], options)
  }

  public async all(keys: Key<T>[] = ['*'], options?: QueryOptions): Promise<T[]> {
    return this.filter(`SELECT ${KeyUtils.join(keys)} FROM ${this.name}`, [], options)
  }

  public async find(query: string, params?: any[], options?: QueryOptions): Promise<T> {
    let result: ResultSet | Error, record: T

    result = await this.execute(query, params, { fetchSize: 1, ...options })
    if (result instanceof Error) return clone<T>(this.dummy)

    record = RowUtils.toRecord(result.columns, result.first())
    if (Object.keys(record).length <= 0) return clone<T>(this.dummy)

    return record
  }

  public async filter(query: string, params?: any[], options?: QueryOptions): Promise<T[]> {
    let result: ResultSet | Error, records: T[]

    result = await this.execute(query, params, options)
    if (result instanceof Error) return []

    records = RowUtils.toRecords(result.columns, result.rows)
    records = records.filter((v: T) => v.id.length > 0)

    return records
  }

  public async write(data: T, timestamp: number = Date.now(), options?: QueryOptions): Promise<Identity> {
    let clone: T, validation: boolean, id: Identity | Error, result: ResultSet | Error

    clone = deserialize(serialize(data))
    delete clone.id
    delete clone.timestamp

    validation = this.validate(clone)
    if (!validation) {
      console.error(this.name, clone, this.validate.errors)
      return ''
    }

    id = data.id || (await ID.unique(this))
    if (id instanceof Error) return ''

    clone.id = id
    clone.timestamp = timestamp

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

import AJV, { ValidateFunction } from 'ajv'
import { QueryOptions } from 'cassandra-driver'
import { deserialize, serialize } from 'v8'
import Cassandra from '..'
import { Status } from '../definitions/enums'
import { Record, ResultSet } from '../definitions/types'
import Child from '../modules/child'
import clone from '../modules/clone'
import ID from '../modules/id'
import tcp from '../modules/tcp'
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

  public async read(id: string, options?: QueryOptions): Promise<T> {
    return this.find(`SELECT * FROM ${this.name} WHERE id = ?`, [id], options)
  }

  public async all(options?: QueryOptions): Promise<T[]> {
    return this.filter(`SELECT * FROM ${this.name}`, [], options)
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

    return records
  }

  public async write(data: T, options?: QueryOptions): Promise<string> {
    let clone: T, id: string | Error, result: ResultSet | Error

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

  public async unlink(id: string, options?: QueryOptions): Promise<boolean> {
    return this.delete(`DELETE FROM ${this.name} WHERE id = ?`, [id], options)
  }

  public async delete(query: string, params?: any[], options?: QueryOptions): Promise<boolean> {
    let result: ResultSet | Error

    result = await this.execute(query, params, options)
    if (result instanceof Error) return false

    return true
  }

  public async exists(id: string): Promise<boolean | Error> {
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

  public async initialization(): Promise<void> {
    return new Promise<void>((r) => setInterval(() => this.status === Status.ON && r(), 100))
  }

  private async execute(query: string, params: any[] = [], options: QueryOptions = {}): Promise<ResultSet | Error> {
    return this.status === Status.ON
      ? params.includes('')
        ? new Error()
        : tcp(() => this.cassandra.client.execute(query, params, { prepare: true, ...options }))
      : new Error()
  }
}

export default Table

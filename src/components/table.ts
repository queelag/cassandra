import AJV, { ValidateFunction } from 'ajv'
import { QueryOptions } from 'cassandra-driver'
import { deserialize, serialize } from 'v8'
import Cassandra from '..'
import { Record, ResultSet } from '../definitions/types'
import Child from '../modules/child'
import clone from '../modules/clone'
import tcp from '../modules/tcp'
import TimeUUID from '../modules/time.uuid'
import BufferUtils from '../utils/buffer.utils'
import RowUtils from '../utils/row.utils'

class Table<T extends Record> extends Child {
  private readonly dummy: T
  private readonly name: string

  public readonly validate: ValidateFunction

  constructor(cassandra: Cassandra, name: string, dummy: T, schema: object) {
    super(cassandra)

    this.dummy = dummy
    this.name = name
    this.validate = new AJV().compile(schema)
  }

  public async read(id: string, options?: QueryOptions): Promise<T> {
    return this.find(`SELECT * FROM ${this.name} WHERE id = ${id}`, [], options)
  }

  public async all(options?: QueryOptions): Promise<T[]> {
    return this.filter(`SELECT * FROM ${this.name}`, [], options)
  }

  public async find(query: string, params?: any[], options?: QueryOptions): Promise<T> {
    let result: ResultSet | Error, record: T

    result = await this.execute(query, params, { fetchSize: 1, ...options })
    if (result instanceof Error) return clone<T>(this.dummy)

    record = RowUtils.toRecord(result.first())
    if (Object.keys(record).length <= 0) return clone<T>(this.dummy)

    record.id = BufferUtils.toString(record.id)

    return record
  }

  public async filter(query: string, params?: any[], options?: QueryOptions): Promise<T[]> {
    let result: ResultSet | Error, records: T[]

    result = await this.execute(query, params, options)
    if (result instanceof Error) return []

    records = RowUtils.toRecords(result.rows)

    return records
  }

  public async write(data: T, options?: QueryOptions): Promise<string> {
    let clone: T, result: ResultSet | Error

    clone = deserialize(serialize(data))
    delete clone.id

    if (!this.validate(clone)) {
      console.error(this.validate.errors)
      return ''
    }

    clone.id = data.id || TimeUUID.now().toString()

    result = await this.execute(`INSERT INTO ${this.name} JSON '${JSON.stringify(clone)}'`, [], options)
    if (result instanceof Error) return ''

    return clone.id
  }

  public async unlink(id: string, options?: QueryOptions): Promise<boolean> {
    return this.delete(`DELETE FROM ${this.name} WHERE id = ${id}`, [], options)
  }

  public async delete(query: string, params?: any[], options?: QueryOptions): Promise<boolean> {
    let result: ResultSet | Error

    result = await this.execute(query, params, options)
    if (result instanceof Error) return false

    return true
  }

  private async execute(query: string, params: any[] = [], options: QueryOptions = {}): Promise<ResultSet | Error> {
    return tcp(() => this.cassandra.client.execute(query, params, { prepare: true, ...options }))
  }
}

export default Table

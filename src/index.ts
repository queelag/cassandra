import { Client, DseClientOptions } from 'cassandra-driver'
import Table from './components/table'
import { Key } from './definitions/types'
import ID from './modules/id'
import KeyUtils from './utils/key.utils'

class Cassandra {
  public readonly client: Client
  public connected: boolean

  constructor(options: DseClientOptions) {
    this.client = new Client(options)
    this.client.connect().then(() => (this.connected = true))
  }

  public async initialization(): Promise<void> {
    return new Promise<void>((r) => setInterval(() => this.connected && r(), 100))
  }
}

export default Cassandra
export { ID, Table, KeyUtils }
export { Key }

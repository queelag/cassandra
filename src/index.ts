import { Client, DseClientOptions } from 'cassandra-driver'
import Table from './components/table'

class Cassandra {
  public readonly client: Client

  constructor(options: DseClientOptions) {
    this.client = new Client(options)
  }
}

export default Cassandra
export { Table }

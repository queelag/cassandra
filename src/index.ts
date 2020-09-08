import { Client } from 'cassandra-driver'
import Table from './components/table'

class Cassandra {
  public readonly client: Client

  constructor(client: Client) {
    this.client = client
  }
}

export default Cassandra
export { Table }

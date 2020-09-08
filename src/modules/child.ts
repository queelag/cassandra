import Cassandra from '..'

class Child {
  protected readonly cassandra: Cassandra

  constructor(cassandra: Cassandra) {
    this.cassandra = cassandra
  }
}

export default Child

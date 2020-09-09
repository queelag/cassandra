import Chance from 'chance'
import Cassandra, { Table } from '../src/index'

const chance: Chance.Chance = new Chance()
const dummy: { user: User } = {
  user: { id: '', name: '', surname: '', bbPin: '', billing: { address: '', postalCode: '' } }
}

describe('Cassandra', () => {
  let cassandra: Cassandra, users: Table<User>, user: User

  beforeAll(async () => {
    cassandra = new Cassandra({ contactPoints: ['127.0.0.1:9042'], localDataCenter: 'datacenter1', keyspace: 'database' })
    await cassandra.client.connect()

    users = new Table<User>(cassandra, 'users', dummy.user, {})
    await users.initialization()

    user = dummy.user
  })

  it('finds nothing', async () => {
    expect(await users.find('SELECT * FROM users')).toMatchObject(dummy.user)
  })

  it('writes single record', async () => {
    delete user.id

    user.name = chance.first()
    user.surname = chance.last()
    user.bbPin = chance.bb_pin()
    user.billing = {
      address: chance.address(),
      postalCode: chance.postal()
    }

    user.id = await users.write(user)
    expect(user.id.length).toBeGreaterThan(0)
  })

  it('reads previously written single record', async () => {
    expect(await users.read(user.id)).toMatchObject(user)
  })

  it('updates previous record', async () => {
    user.name = chance.first()
    user.surname = chance.last()
    user.bbPin = chance.bb_pin()
    user.billing = {
      address: chance.address(),
      postalCode: chance.postal()
    }

    user.id = await users.write(user)
    expect(user.id.length).toBeGreaterThan(0)
    expect(await users.read(user.id)).toMatchObject(user)
  })

  it('filters by name and surname of previously written record', async () => {
    expect(await users.filter(`SELECT * FROM users WHERE name = '${user.name}' AND surname = '${user.surname}' ALLOW FILTERING`)).toMatchObject([user])
  })

  it('writes new record', async () => {
    delete user.id

    user.name = chance.first()
    user.surname = chance.last()
    user.bbPin = chance.bb_pin()
    user.billing = {
      address: chance.address(),
      postalCode: chance.postal()
    }

    user.id = await users.write(user)
    expect(user.id.length).toBeGreaterThan(0)
  })

  it('unlinks new record', async () => {
    expect(await users.unlink(user.id)).toBeTruthy()
    expect(await users.read(user.id)).toMatchObject(dummy.user)
  })

  it('deletes all records', async () => {
    let all: User[], ids: string[]

    all = await users.all()
    expect(all).toHaveLength(1)

    ids = all.reduce((r: string[], v: User) => [...r, v.id], [])
    expect(ids).toHaveLength(1)

    expect(await users.delete(`DELETE FROM users WHERE id in (${ids.join(',')})`))
    expect(await users.all()).toHaveLength(0)
  })

  afterAll(async () => {
    await cassandra.client.execute('TRUNCATE TABLE users')
    await cassandra.client.shutdown()
  })
})

type User = {
  id?: string
  name: string
  surname: string
  bbPin: string
  billing: {
    address: string
    postalCode: string
  }
  timestamp?: number
}

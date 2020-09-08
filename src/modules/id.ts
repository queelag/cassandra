import Table from '../components/table'
import UUID from './uuid'

class ID {
  static async unique<T>(table: Table<T>): Promise<string | Error> {
    let id: string, exists: boolean | Error

    while (true) {
      id = UUID.random().toString()
      exists = await table.exists(id)

      if (exists === false) return id
      if (exists instanceof Error) return exists
    }
  }
}

export default ID

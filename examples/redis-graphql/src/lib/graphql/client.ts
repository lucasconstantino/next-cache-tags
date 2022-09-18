import { ApolloClient, InMemoryCache } from '@apollo/client'
import { SchemaLink } from '@apollo/link-schema'

import { schema } from './schema'

const client = new ApolloClient({
  link: new SchemaLink({ schema }),
  cache: new InMemoryCache(),
})

export { client }

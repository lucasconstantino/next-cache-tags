import { makeExecutableSchema } from '@graphql-tools/schema'
import db from './db.json'

const schema = makeExecutableSchema({
  typeDefs: `
    type Query {
      posts: [Post!]!
    }

    type Author {
      id: String!
      firstName: String!
      lastName: String!
      posts: [Post!]!
    }

    type Post {
      id: String!
      title: String!
      body: String!
      createdAt: String!
      author: Author!
    }
  `,
  resolvers: {
    Query: {
      posts: () => db.posts,
    },

    Author: {
      posts: ({ id }: { id: string }) =>
        db.posts.filter(post => post.author === id),
    },

    Post: {
      author: ({ author }: { author: string }) =>
        db.authors.find(({ id }) => id === author),
    },
  },
})

export { schema }

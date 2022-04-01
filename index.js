const { ApolloServer } = require('apollo-server');
const dataSource = require('./dataSource.js');
const typeDefs = require('./gqlDefs.js');
const resolvers = require('./resolvers.js');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return dataSource;
  },
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

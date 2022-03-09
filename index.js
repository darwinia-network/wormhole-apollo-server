const { ApolloServer } = require('apollo-server');
const DataSource = require("./dataSource.js");
const typeDefs = require("./gqlDefs.js");
const resolvers = require("./resolvers.js");

const server = new ApolloServer({ typeDefs, resolvers,
    dataSources: () => {
        return DataSource;
    }
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

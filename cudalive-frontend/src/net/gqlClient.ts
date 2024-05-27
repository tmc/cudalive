import { ApolloClient, InMemoryCache } from '@apollo/client';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const BASE_GRAPHQL_URL = import.meta.env.VITE_BASE_GRAPHQL_URL || 'http://localhost:8080'
const BASE_GRAPHQL_SUBSCRIPTIONS_URL = import.meta.env.VITE_BASE_GRAPHQL_SUBSCRIPTIONS_URL || `${BASE_GRAPHQL_URL.replace(/^http/, 'ws')}/graphql`

const httpLink = new HttpLink({
  uri: BASE_GRAPHQL_URL,
});

const wsLink = new GraphQLWsLink(createClient({
  url: BASE_GRAPHQL_SUBSCRIPTIONS_URL,
}));

// The split function takes three parameters:
//
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

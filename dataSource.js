const { RESTDataSource } = require('apollo-datasource-rest');
const isProd = process.env.NODE_ENV === 'prod';

class Darwinia2CrabMappingTokenFactory extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'https://crab-thegraph.darwinia.network/subgraphs/name/wormhole/';
  }

  // filter = where: {start_timestamp_lt: ${start_timestamp}}
  async burnRecordEntities(first, filter) {
    return this.post(`Sub2SubMappingTokenFactory`, {
      query: `query { burnRecordEntities (first: ${first}, orderBy: nonce, orderDirection: desc, ${filter}) {id, lane_id, nonce, amount, start_timestamp, end_timestamp, request_transaction, response_transaction, result, token, sender, recipient}}`,
      variables: null,
    });
  }

  async dailyStatistics(filter) {
    return this.post(`Sub2SubMappingTokenFactory`, {
      query: `query { burnDailyStatistics (orderBy: id, orderDirection: desc, ${filter}) {id, dailyVolume, dailyCount}}`,
      variables: null,
    });
  }
}

class Darwinia2CrabBacking extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'https://api.subquery.network/sq/darwinia-network/';
  }

  //filter: {startTimestamp: {lessThan: \"${date}\"}}
  async lockRecordEntities(first, filter) {
    return this.post(`wormhole-darwinia`, {
      query: `query { s2sEvents (first: ${first}, orderBy: NONCE_DESC, ${filter}) {nodes{id, laneId, nonce, amount, startTimestamp, endTimestamp, requestTxHash, responseTxHash, result, token, senderId, recipient}}}`,
      variables: null,
    });
  }

  //https://api.subquery.network/sq/darwinia-network/wormhole-darwinia__ZGFyd
  async dailyStatistics(filter) {
    return this.post(`wormhole-darwinia`, {
      query: `query { s2sDailyStatistics (orderBy: ID_DESC, ${filter}) {nodes{id, dailyVolume, dailyCount}}}`,
      variables: null,
    });
  }
}

module.exports = {
  darwinia2CrabMappingTokenFactory: new Darwinia2CrabMappingTokenFactory(),
  darwinia2CrabBacking: new Darwinia2CrabBacking(),
};

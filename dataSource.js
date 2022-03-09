const { RESTDataSource } = require('apollo-datasource-rest');

class Darwinia2CrabMappingTokenFactory extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'https://crab-thegraph.darwinia.network/subgraphs/name/wormhole/';
    }

    // filter = where: {start_timestamp_lt: ${start_timestamp}}
    async burnRecordEntities(first, filter) {
        return this.post(`Sub2SubMappingTokenFactory`, {
            query: `query { burnRecordEntities (first: ${first}, orderBy: nonce, orderDirection: desc, ${filter}) {id, lane_id, nonce, amount, start_timestamp, end_timestamp, request_transaction, response_transaction, result, token, sender, recipient}}`,
            variables:null
        });
    }
}

class Darwinia2CrabBacking extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = 'https://api.subquery.network';
    }

    //filter: {startTimestamp: {lessThan: \"${date}\"}}
    async lockRecordEntities(first, filter) {
        return this.post(`sq/darwinia-network/wormhole-darwinia`, {
            query: `query { s2sEvents (first: ${first}, orderBy: NONCE_DESC, ${filter}) {nodes{id, laneId, nonce, amount, startTimestamp, endTimestamp, requestTxHash, responseTxHash, result, token, sender, recipient}}}`,
            variables:null
        });
    }
}

var DataSource = {
    darwinia2CrabMappingTokenFactory: new Darwinia2CrabMappingTokenFactory(),
    darwinia2CrabBacking: new Darwinia2CrabBacking(),
}

module.exports = DataSource

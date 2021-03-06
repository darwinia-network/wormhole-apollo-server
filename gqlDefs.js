const { gql } = require('apollo-server');

const typeDefs = gql`
  scalar BigInt

  type BurnRecordEntity {
    id: ID!
    lane_id: String! # bytes
    nonce: String!
    request_transaction: String!
    response_transaction: String
    sender: String!
    recipient: String!
    token: String!
    amount: String!
    start_timestamp: Int!
    end_timestamp: Int
    result: Int
    fee: Int
  }

  type S2sEvent {
    id: ID!
    laneId: String!
    nonce: String!
    requestTxHash: String! # TokenLocked tx hash
    responseTxHash: String # TokenLockedConfirmed tx hash
    sender: String!
    result: Int! # 0 TokenLocked 1 TokenLockedConfirmed success 2 TokenLockedConfirmed fail
    recipient: String!
    token: String! # token address
    amount: String!
    startTimestamp: String!
    endTimestamp: String
    fee: String!
  }

  type S2sRecord {
    id: ID!
    fromChain: String!
    fromChainMode: String!
    toChain: String!
    toChainMode: String!
    bridge: String!
    laneId: String!
    nonce: String!
    requestTxHash: String!
    responseTxHash: String
    sender: String!
    recipient: String!
    token: String!
    amount: String!
    startTime: String!
    endTime: String
    result: Int!
    fee: String!
  }

  type DailyStatistic {
    id: ID!
    dailyVolume: BigInt
    dailyCount: Int
  }

  type BurnRecordEntity_filter {
    start_timestamp_lt: Int
  }

  type Query {
    burnRecordEntities(first: Int, start_timestamp: Int, sender: String, recipient: String): [BurnRecordEntity]
    lockRecordEntities(first: Int, start_timestamp: Int, sender: String, recipient: String): [S2sEvent]
    s2sRecords(first: Int, start_timestamp: Int, sender: String): [S2sRecord]
    dailyStatistics(first: Int, timepast: Int, chain: String): [DailyStatistic]
  }
`;

module.exports = typeDefs;

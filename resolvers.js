const BigInt = require("apollo-type-bigint");

const FormatTimestamp = function(timestamp) {
    return new Date(timestamp * 1000).toISOString().slice(0, 19);
}

const BurnRecordEntityTos2sRecords = function(burnRecord) {
    return {
        id: burnRecord.id,
        fromChain: "crab",
        toChain: "darwinia",
        bridge: "helix",
        laneId: burnRecord.lane_id,
        nonce: burnRecord.nonce,
        requestTxHash: burnRecord.request_transaction,
        responseTxHash: burnRecord.response_transaction,
        sender: burnRecord.sender,
        recipient: burnRecord.recipient,
        token: burnRecord.token,
        amount: burnRecord.amount,
        startTime: FormatTimestamp(burnRecord.start_timestamp),
        endTime: FormatTimestamp(burnRecord.end_timestamp),
        result: burnRecord.result
    }
}

const S2sEventTos2sRecords = function(s2sEvent) {
    return {
        id: s2sEvent.id,
        fromChain: "darwinia",
        toChain: "crab",
        bridge: "helix",
        laneId: s2sEvent.laneId,
        nonce: s2sEvent.nonce,
        requestTxHash: s2sEvent.requestTxHash,
        responseTxHash: s2sEvent.responseTxHash,
        sender: s2sEvent.senderId,
        recipient: s2sEvent.recipient,
        token: s2sEvent.token,
        amount: s2sEvent.amount,
        startTime: s2sEvent.startTimestamp,
        endTime: s2sEvent.endTimestamp,
        result: s2sEvent.result
    }
}

const resolvers = {
  BigInt: new BigInt.default("bigInt"),
  Query: {
      burnRecordEntities: async (_, { first, start_timestamp, sender, recipient }, { dataSources }) => {
          var filter = `start_timestamp_lt: ${start_timestamp}`;
          if (sender) {
              filter = `${filter}, sender: \"${sender}\"`;
          }
          if (recipient) {
              filter = `${filter}, recipient: \"${recipient}\"`;
          }
          filter = `where: { ${filter} }`;
          console.log(filter);
          //const filter = `where: { start_timestamp_lt: ${start_timestamp}}`;
          const data = await dataSources.darwinia2CrabMappingTokenFactory.burnRecordEntities(first, filter);
          return data.data.burnRecordEntities;
      },
      lockRecordEntities: async (_, { first, start_timestamp, sender, recipient }, { dataSources }) => {
          const date = FormatTimestamp(start_timestamp);
          var filter = `startTimestamp: {lessThan: \"${date}\"}`;
          if (sender) {
              filter = `${filter}, sender: {equalTo: \"${sender}\"}`;
          }
          if (recipient) {
              filter = `${filter}, recipient: {equalTo: \"${recipient}\"}`;
          }
          filter = `filter: { ${filter} }`;
          console.log(filter);
          const data = await dataSources.darwinia2CrabBacking.lockRecordEntities(first, filter);
          return data.data.s2sEvents.nodes;
      },
      s2sRecords: async (_, { first, start_timestamp, sender }, { dataSources }) => {
          const date = FormatTimestamp(start_timestamp);
          var filterBurn = `start_timestamp_lt: ${start_timestamp}`;
          var filterLock = `startTimestamp: {lessThan: \"${date}\"}`;
          if (sender) {
              filterBurn = `${filterBurn}, sender: \"${sender}\"`;
              filterLock =  `${filterLock}, sender: {equalTo: \"${sender}\"}`;
          }
          filterBurn = `where: { ${filterBurn} }`;
          filterLock = `filter: { ${filterLock} }`;
          var burnRecords = await dataSources.darwinia2CrabMappingTokenFactory.burnRecordEntities(first, filterBurn);
          var lockRecords = await dataSources.darwinia2CrabBacking.lockRecordEntities(first, filterLock);
          var s2sRecordList = [];
          var left = burnRecords.data.burnRecordEntities;
          var right = lockRecords.data.s2sEvents.nodes;
          while (left.length && right.length) {
              const record = FormatTimestamp(left[0].start_timestamp) >= right[0].startTimestamp ? BurnRecordEntityTos2sRecords(left.shift()) : S2sEventTos2sRecords(right.shift());
              s2sRecordList.push(record);
              if (s2sRecordList.length >= first) {
                  return s2sRecordList;
              }
          }
          var more = left.length > 0 ? left : right;
          var convert = left.length > 0 ? BurnRecordEntityTos2sRecords : S2sEventTos2sRecords;
          for (var idx in more) {
              s2sRecordList.push(convert(more[idx]));
              if (s2sRecordList.length >= first) {
                  return s2sRecordList;
              }
          }
          return s2sRecordList;
      },
      // TODO store volumes for different asset and use price oracle to transform into dollar value
      dailyStatistics: async (_, { first, timepast, chain }, { dataSources }) => {
          const now = Date.now()/1000;
          const timelimit = Math.floor(now - timepast);
          var filterBurnDaily = `where: {id_gte: ${timelimit}}`;
          var filterLockDaily = `filter: {id: {greaterThanOrEqualTo: \"${timelimit}\"}}`;
          if (chain == "darwinia") {
              var dailyStatistics = await dataSources.darwinia2CrabMappingTokenFactory.dailyStatistics(filterBurnDaily);
              return dailyStatistics.data.burnDailyStatistics;
          } else if (chain == "crab") {
              var dailyStatistics = await dataSources.darwinia2CrabBacking.dailyStatistics(filterLockDaily);
              return dailyStatistics.data.s2sDailyStatistics.nodes;
          }
          var s2sBurnDaily = await dataSources.darwinia2CrabMappingTokenFactory.dailyStatistics(filterBurnDaily);
          var s2sLockDaily = await dataSources.darwinia2CrabBacking.dailyStatistics(filterLockDaily);

          var left = s2sBurnDaily.data.burnDailyStatistics;
          var right = s2sLockDaily.data.s2sDailyStatistics.nodes;
          var records = [];
          var lastRecord;
          while (left.length && right.length) {
              const record = left[0].id >= right[0].id ? left.shift() : right.shift();
              if (!lastRecord) {
                  lastRecord = record;
                  continue;
              }
              console.log(lastRecord.id, record.id);
              if (lastRecord.id == record.id) {
                  lastRecord.dailyVolume = global.BigInt(lastRecord.dailyVolume) + global.BigInt(record.dailyVolume);
                  lastRecord.dailyCount += record.dailyCount;
                  continue;
              } else {
                  records.push(lastRecord);
                  lastRecord = record;
              }
              if (first && records.length >= first) {
                  return records;
              }
          }
          var more = left.length > 0 ? left : right;
          if (lastRecord && more.length > 0) {
              if (lastRecord.id == more[0].id) {
                  more[0].dailyVolume = global.BigInt(more[0].dailyVolume) + global.BigInt(lastRecord.dailyVolume);
                  more[0].dailyCount += lastRecord.dailyCount;
              } else {
                  records.push(lastRecord);
              }
          }
          for (var idx in more) {
              records.push(more[idx]);
              if (first && records.length >= first) {
                  return records;
              }
          }
          return records;
      },
  },
};

module.exports = resolvers

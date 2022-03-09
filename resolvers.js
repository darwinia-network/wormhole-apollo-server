const FormatTimestamp = function(timestamp) {
    return new Date(timestamp * 1000).toISOString().slice(0, 19);
}

const BurnRecordEntityTos2sRecords = function(burnRecord) {
    return {
        id: burnRecord.id,
        direction: "crab2darwinia",
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
        direction: "darwinia2crab",
        laneId: s2sEvent.laneId,
        nonce: s2sEvent.nonce,
        requestTxHash: s2sEvent.requestTxHash,
        responseTxHash: s2sEvent.responseTxHash,
        sender: s2sEvent.sender,
        recipient: s2sEvent.recipient,
        token: s2sEvent.token,
        amount: s2sEvent.amount,
        startTime: s2sEvent.startTimestamp,
        endTime: s2sEvent.endTimestamp,
        result: s2sEvent.result
    }
}

const resolvers = {
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
  },
};

module.exports = resolvers

const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'civic_platform'
    }
  });

  const uri = mongod.getUri();
  console.log('MongoDB Memory Server is running!');
  console.log('URI:', uri);
  
  // Keep the process alive
  process.stdin.resume();
})();

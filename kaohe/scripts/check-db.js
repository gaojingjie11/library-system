const { client, database, connectToMongoDB } = require('../config/db');
(async () => {
  try {
    await connectToMongoDB();
    const hello = await client.db('admin').command({ hello: 1 });
    const collections = await database.listCollections({}, { nameOnly: true }).toArray();
    console.log(JSON.stringify({ connected: true, database: database.databaseName, topology: hello.setName ? 'replicaSet' : hello.msg === 'isdbgrid' ? 'mongos' : 'standalone', collections: collections.map(c => c.name) }, null, 2));
  } catch (error) {
    console.error('数据库连接失败:', error.code || error.name);
    process.exitCode = 1;
  } finally { await client.close(); }
})();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const resolver = new dns.promises.Resolver();
console.log('Resolver servers:', resolver.getServers());
resolver.resolveSrv('_mongodb._tcp.cluster0.lb4bxr6.mongodb.net')
  .then(res => console.log('Resolver Promise resolved:', res))
  .catch(err => console.log('Resolver Promise rejected:', err.message));

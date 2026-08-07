const dns = require('dns');
console.log('Before setServers (callbacks):', dns.getServers());
console.log('Before setServers (promises):', dns.promises.getServers ? dns.promises.getServers() : 'no getServers on promises');

dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log('After setServers (callbacks):', dns.getServers());
console.log('After setServers (promises):', dns.promises.getServers ? dns.promises.getServers() : 'no getServers on promises');

dns.promises.resolveSrv('_mongodb._tcp.cluster0.lb4bxr6.mongodb.net')
  .then(res => console.log('Promise resolved:', res))
  .catch(err => console.log('Promise rejected:', err.message));

$env:NODE_OPTIONS = "--require C:\Users\chinn\node-dns-fix.js"
node -e "console.log(require('dns').getServers())"
node -e "require('dns').resolve4('google.com', (err, res) => console.log(err || res))"
node -e "require('dns').resolveSrv('_mongodb._tcp.cluster0.lb4bxr6.mongodb.net', (err, res) => console.log(err || res))"

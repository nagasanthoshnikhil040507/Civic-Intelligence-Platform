$env:NODE_OPTIONS="--dns-result-order=ipv4first"
node -e "console.log(require('dns').getServers())"
node -e "require('dns').resolve4('google.com', (err, res) => console.log(err || res))"

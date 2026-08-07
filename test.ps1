$env:RES_OPTIONS="nameserver 8.8.8.8"
node -e "console.log(require('dns').getServers())"
node -e "require('dns').resolve4('google.com', (err, res) => console.log(err || res))"

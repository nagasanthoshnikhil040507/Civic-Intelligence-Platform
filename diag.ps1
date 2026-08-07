echo "--- NODE_OPTIONS ---"
echo $env:NODE_OPTIONS
echo "--- RES_OPTIONS ---"
echo $env:RES_OPTIONS
echo "--- ALL ENV VARS ---"
Get-ChildItem Env: | Out-String
echo "--- IPCONFIG ---"
ipconfig /all | Select-String "DNS" | Out-String
echo "--- NODE DNS ---"
node -e "console.log(require('dns').getServers())"

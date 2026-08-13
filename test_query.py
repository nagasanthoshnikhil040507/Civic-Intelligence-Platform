import pymongo
client = pymongo.MongoClient('mongodb://civic_admin:Nikhil0405@ac-iqjevtt-shard-00-00.lb4bxr6.mongodb.net:27017,ac-iqjevtt-shard-00-01.lb4bxr6.mongodb.net:27017,ac-iqjevtt-shard-00-02.lb4bxr6.mongodb.net:27017/?ssl=true&replicaSet=atlas-mrk96q-shard-0&authSource=admin&appName=Cluster0')
db = client['test']
coll = db['complaints']
query = {'location': {'$near': {'$geometry': {'type': 'Point', 'coordinates': [0, 0]}, '$maxDistance': 30}}}
try:
    results = list(coll.find(query))
    print('Found:', len(results))
except Exception as e:
    print('Error:', e)

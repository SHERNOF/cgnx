const dotenv = require('dotenv')
dotenv.config()
const mongodb = require('mongodb')

mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
    module.exports = client
    const cgx = require('./cgx')
    cgx.listen(process.env.PORT)
})
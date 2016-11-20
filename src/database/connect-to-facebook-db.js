const mongo = require('mongodb').MongoClient

const url = process.env.MOB_MONGO_FACEBOOK_DATABASE || 'mongodb://localhost:27017/mobyourlife_facebook'

export function connectToFacebookDatabase() {
  return new Promise((resolve, reject) => {
    mongo.connect(url, (err, db) => {
      if (err) {
        var error = new Error('Unable to connect to the server!')
        error.database_url = url
        error.message = err
        reject(error)
      } else {
        resolve(db)
      }
    })
  })
}

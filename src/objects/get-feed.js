export function getFeed(db, fb_account_id) {
  return new Promise((resolve, reject) => {
    try {
      const feed = db.collection('feed')
      feed.find({ fb_account_id })
      .sort({ updated_time: -1 })
      .toArray((err, docs) => {
        if (err) {
          reject('Unable to query feed!' + err)
        } else {
          if (docs.length > 0) {
            resolve(docs)
          } else {
            reject('No feed for the requested account!')
          }
        }
      })
    } catch(err) {
      reject(err)
    }
  })
}

export function getPage(db, fb_account_id) {
  return new Promise((resolve, reject) => {
    try {
      const pages = db.collection('pages')
      pages.find({ fb_account_id })
      .sort({ _id: -1 })
      .toArray((err, docs) => {
        if (err) {
          reject('Unable to query page!' + err)
        } else {
          if (docs.length > 0) {
            resolve(docs[0])
          } else {
            reject('Page not found for the requested account!')
          }
        }
      })
    } catch(err) {
      reject(err)
    }
  })
}

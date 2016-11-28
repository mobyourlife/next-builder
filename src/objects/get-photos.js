export function getPhotos(db, fb_account_id) {
  return new Promise((resolve, reject) => {
    try {
      const photos = db.collection('photos')
      photos.find({ fb_account_id })
      .sort({ _id: -1 })
      .limit(64)
      .toArray((err, docs) => {
        if (err) {
          reject('Unable to query photos!' + err)
        } else {
          if (docs.length > 0) {
            resolve(docs)
          } else {
            reject('No photos for the requested account!')
          }
        }
      })
    } catch(err) {
      reject(err)
    }
  })
}

export function setBuildTime(db, fb_account_id) {
  return new Promise((resolve, reject) => {
    try {
      const pages = db.collection('pages')
      pages.update({ fb_account_id }, {
        $set: {
          'log.last_built': new Date(),
          'log.build_updated': true
        }
      }, (err, result) => {
        if (err) {
          reject('Unable to set build time!' + err)
        } else {
          resolve()
        }
      })
    } catch(err) {
      reject(err)
    }
  })
}

import { connectToFacebookDatabase } from './database'
import { getPhotos } from './objects'
import { renderPage, saveFile } from './transform'

const THEME = 'default'
const COMMON_INFO = {
  page: {
    title: 'Início',
    description: 'Site de teste',
    author: 'Fiipe Oliveira'
  },
  site: {
    title: 'Teste'
  }
}

require('marko/node-require').install()

function buildWebsite(fb_account_id) {
  Promise.all([
    connectToFacebookDatabase()
  ]).then(data => {
    const [db] = data
    const path = `../teste/${fb_account_id}`

    // Index page
    const renderIndex = renderPage('default', 'index', COMMON_INFO)
    .then(html => saveFile(path, 'index.html', html))
    .then(console.log, console.error)

    // Photos page
    const renderPhotos = getPhotos(db, fb_account_id).then(photos => {
        let payload = JSON.parse(JSON.stringify(COMMON_INFO))
        payload.page.title = 'Fotos'
        payload.photos = photos.map(i => {
          return {
            fb_album_id: i.fb_album_id,
            fb_photo_id: i.fb_photo_id,
            image_small: i.images[i.images.length - 1],
            image_large: i.images[0],
            time: i.updated_time || i.created_time
          }
        })
        return renderPage(THEME, 'photos', payload)
      })
    .then(html => saveFile(path, 'fotos.html', html))
    .then(console.log, console.error)

    // Wait to finish everything
    Promise.all([
      renderIndex,
      renderPhotos
    ]).then(() => db.close())
  })
}

if (process.argv.length === 3) {
  buildWebsite(process.argv[2])
} else {
  console.log('Sintaxe correta: babel-node src/main.js 123456789')
}

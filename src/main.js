import { connectToFacebookDatabase } from './database'
import { getPage, getPhotos } from './objects'
import { renderPage, saveFile } from './transform'

const THEME = 'default'

require('marko/node-require').install()

function buildWebsite(fb_account_id) {
  Promise.all([
    connectToFacebookDatabase()
  ]).then(data => {
    const [db] = data
    const path = `../teste/${fb_account_id}`

    // Basic info about the page
    getPage(db, fb_account_id).then(info => {
      const site = {
        title: info.name,
        cover: info.cover,
        theme: 'united'
      }

      // Index page
      const renderIndex = renderPage('default', 'index', {
        page: {
          title: 'Início',
          description: 'Página inicial do site',
          author: 'Mob Your Life'
        },
        site
      })
      .then(html => saveFile(path, 'index.html', html))
      .then(console.log, console.error)

      // Photos page
      const renderPhotos = getPhotos(db, fb_account_id).then(photos => {
          return renderPage(THEME, 'photos', {
            page: {
              title: 'Fotos',
              description: 'Fotos do site',
              author: 'Mob Your Life'
            },
            site,
            photos: photos.map(i => {
              return {
                fb_album_id: i.fb_album_id,
                fb_photo_id: i.fb_photo_id,
                image_small: i.images[i.images.length - 1],
                image_large: i.images[0],
                time: i.updated_time || i.created_time
              }
            })
          })
        })
      .then(html => saveFile(path, 'fotos.html', html))
      .then(console.log, console.error)

      // Contact page
      const renderContact = renderPage(THEME, 'contact', {
        page: {
          phone: info.phone,
          location: info.location,
          maps_address: makeMapsAddress(info.location)
        },
        site,
        api: {
          gmaps_key: 'AIzaSyDAR_lqzrM4bOUxd1hOmxOzFs_xcewoQbA'
        }
      })
      .then(html => saveFile(path, 'contato.html', html))
      .then(console.log, console.error)

      // Wait to finish everything
      Promise.all([
        renderIndex,
        renderPhotos,
        renderContact
      ]).then(() => db.close())
    }, err => {
      db.close()
    })
  })
}

if (process.argv.length === 3) {
  buildWebsite(process.argv[2])
} else {
  console.log('Sintaxe correta: babel-node src/main.js 123456789')
}

function makeMapsAddress(location) {
  const fields = [
    location.street,
    location.city,
    location.state,
    location.country,
    location.latitude,
    location.longitude
  ]

  const useful = fields.filter(i => !!i)
  const q = useful.join(', ')
  const uri = encodeURI(q)

  return uri
}

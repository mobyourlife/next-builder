import { connectToFacebookDatabase } from './database'
import { connectToMessageQueue, consumeQueue } from './mq'
import { getFeed, getPage, getPhotos, setBuildTime } from './objects'
import { renderPage, saveFile } from './transform'

const MOB_STORAGE_PATH = process.env.MOB_STORAGE_PATH || '../customers'
const THEME = 'default'

require('marko/node-require').install()

const Lynx = require('lynx')
const metrics = new Lynx(process.env.MOB_TELEGRAF_HOSTNAME, 8125)

header()
main()

function main() {
  const BUILD_SITES_QUEUE = 'build_sites'

  Promise.all([
    connectToFacebookDatabase(),
    connectToMessageQueue()
  ]).then(data => {
    console.log('Connected!')
    let [db, ch] = data

    consumeQueue(ch, BUILD_SITES_QUEUE).subscribe(res => {
      const { data, ack } = res
      buildWebsite(db, data.fb_account_id).then(res => {
        metrics.increment('builder.build_website.ok')
        ack()
      }, err => {
        metrics.increment('builder.build_website.err')
        console.log(`Failed to build site for account ID ${data.fb_account_id}!`)
      })
    })
  })
}

function buildWebsite(db, fb_account_id) {
  console.log('Building site for account ID', fb_account_id)

  const path = `${MOB_STORAGE_PATH}/${fb_account_id}`

  // Basic info about the page
  return getPage(db, fb_account_id).then(info => {
    const site = {
      title: info.name,
      cover: info.cover,
      theme: 'united'
    }

    // Index page
    const renderIndex = getFeed(db, fb_account_id).then(feed => {
      return renderPage('default', 'index', {
        page: {
          title: 'Início',
          description: 'Página inicial do site',
          author: 'Mob Your Life'
        },
        site,
        feed: feed.map(i => {
          i.updated_time = formatDate(i.updated_time)
          i.message = breakLines(i.message)
          return i
        })
      })
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
    const time = process.hrtime()
    return Promise.all([
      renderIndex,
      renderPhotos,
      renderContact
    ])
    .then(() => {
      const elapsed = process.hrtime(time)
      const diff = elapsed[0] + (elapsed[1] / Math.pow(10, 9))
      metrics.timing('builder.build_website.time', diff)
      setBuildTime(db, fb_account_id)
    })

  }, err => {
    console.log('Error getting page!' + err)
    return db.close()
  })
}

function header() {
  console.log('')
  console.log('=== MOB YOUR LIFE ===')
  console.log(new Date().toISOString() + ' - Builder running...')
  console.log('')
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

function formatDate(date) {
  function leftPad (n) {
    let s = n.toString()
    if (s.length < 2) {
      s = '0' + s
    }
    return s
  }

  if (typeof date === 'string') {
    date = new Date(date)
  }

  const dd = leftPad(date.getDate())
  const mm = leftPad(date.getMonth() + 1)
  const yyyy = date.getFullYear()

  return `${dd}/${mm}/${yyyy}`
}

function breakLines(s) {
  if (s) {
    return s.replace('\n', '<br/>')
  } else {
    return undefined
  }
}

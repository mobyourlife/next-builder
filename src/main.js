import { connectToFacebookDatabase } from './database'
import { connectToMessageQueue, consumeQueue } from './mq'
import { getFeed, getPage, getPhotos, setBuildTime } from './objects'
import { renderPage, saveFile } from './transform'

const MOB_STORAGE_PATH = process.env.MOB_STORAGE_PATH || '../customers'

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
        console.log(`Failed to build site for account ID ${data.fb_account_id}! ${err}`)
      })
    })
  })
}

function makeNginxConfig(fb_account_id, domain) {
  const config = `
  server {
      listen 80;
      server_name ${domain};
      root ${MOB_STORAGE_PATH}/${fb_account_id};

      error_page 500 502 503 504  /50x.html;
      location = /50x.html {
          root /usr/share/nginx/html;
      }
  }
  `
  return new Promise((resolve, reject) => {
    resolve(config)
  })
}

function buildWebsite(db, fb_account_id) {
  console.log('Building site for account ID', fb_account_id)

  const path = `${MOB_STORAGE_PATH}/${fb_account_id}`

  // Basic info about the page
  return getPage(db, fb_account_id).then(info => {
    const site = {
      title: (info.custom && info.custom.title) || info.name,
      hero_text_color: info.custom && info.custom.hero_text_color ? info.custom.hero_text_color : '#000',
      hero_bg_color: info.custom && info.custom.hero_bg_color ? info.custom.hero_bg_color : null,
      hero_image: info.custom && info.custom.hero_image ? info.custom.hero_image === true ? info.cover ? info.cover.source : null : info.custom.hero_image : null,
      theme_name: info.custom && info.custom.theme_name ? info.custom.theme_name : 'default',
      theme_variant: info.custom && info.custom.theme_variant ? info.custom.theme_variant : null,
      analytics_id: info.admin && info.admin.analytics_id ? info.admin.analytics_id : null,
    }

    // nginx config
    const domain = (info.admin && info.admin.domain) || `${fb_account_id}.meumob.site`
    const renderConfig = makeNginxConfig(fb_account_id, domain)
    .then(cfg => saveFile(path, 'nginx.conf', cfg))
    .then(console.log, console.error)

    // Index page
    const renderIndex = getFeed(db, fb_account_id).then(feed => {
      feed = feed.map(i => {
        i.updated_time = formatDate(i.updated_time)
        i.message = breakLines(i.message)
        return i
      })

      return renderPage(site.theme_name, 'index', {
        page: {
          id: 'home',
          title: 'Início',
          description: 'Página inicial do site',
          author: 'Mob Your Life'
        },
        site,
        feed: feed,
        latest: feed.filter(i => i.full_picture).slice(0, 3)
      })
    })
    .then(html => saveFile(path, 'index.html', html))
    .then(console.log, console.error)

    // Photos page
    const renderPhotos = getPhotos(db, fb_account_id).then(photos => {
        return renderPage(site.theme_name, 'photos', {
          page: {
            id: 'photos',
            title: 'Fotos',
            description: 'Fotos do site',
            author: 'Mob Your Life'
          },
          site,
          photos: photos.map(i => {
            return {
              id: i._id,
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
    const renderContact = renderPage(site.theme_name, 'contact', {
      page: {
        id: 'contact',
        title: 'Contato',
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
      renderConfig,
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
  if (!location) {
    return null
  }

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

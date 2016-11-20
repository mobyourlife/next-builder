import fs from 'fs'

require('marko/node-require').install()

renderPage('default', 'index', {
  page: {
    title: 'Início - Teste',
    description: 'Site de teste',
    author: 'Fiipe Oliveira'
  },
  site: {
    title: 'Teste'
  }
})
.then(html => saveFile('../teste', 'index.html', html))
.then(console.log, console.error)

function renderPage(templateName, partialName, data) {
  return new Promise((resolve, reject) => {
    const layout = require('../templates/' + templateName + '/layout.marko')
    const partial = require('../templates/' + templateName + '/partials/' + partialName + '.marko')

    partial.render(data, (err, html) => {
      if (err) {
        reject(err)
      } else {
        let index = JSON.parse(JSON.stringify(data))
        index.partial = html
        layout.render(index, (err, html) => {
          if (err) {
            reject(err)
          } else {
            resolve(html)
          }
        })
      }
    })
  })
}

function saveFile(folderName, fileName, contents) {
  const path = `${folderName}/${fileName}`
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }

    fs.writeFile(path, contents, err => {
      if (err) {
        reject(err)
      } else {
        resolve('Built website successfully!')
      }
    })
  })
}

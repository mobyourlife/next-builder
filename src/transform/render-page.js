export function renderPage(templateName, partialName, data) {
  return new Promise((resolve, reject) => {
    const layout = require('../../templates/' + templateName + '/layout.marko')
    const partial = require('../../templates/' + templateName + '/partials/' + partialName + '.marko')

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

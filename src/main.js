import { renderPage, saveFile } from './transform'

require('marko/node-require').install()

renderPage('default', 'index', {
  page: {
    title: 'Início',
    description: 'Site de teste',
    author: 'Fiipe Oliveira'
  },
  site: {
    title: 'Teste'
  }
})
.then(html => saveFile('../teste', 'index.html', html))
.then(console.log, console.error)

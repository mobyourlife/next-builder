import fs from 'fs'

export function saveFile(folderName, fileName, contents) {
  const path = `${folderName}/${fileName}`
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }

    fs.writeFile(path, contents, err => {
      if (err) {
        reject(err)
      } else {
        resolve(`Built ${fileName} page successfully!`)
      }
    })
  })
}

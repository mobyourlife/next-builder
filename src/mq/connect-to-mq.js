const amqp = require('amqplib/callback_api')

const url = process.env.MOB_RABBITMQ_URL || 'amqp://localhost'

export function connectToMessageQueue() {
  return new Promise((resolve, reject) => {
    amqp.connect(url, (err, conn) => {
      if (err) {
        reject('Unable to connect to the message queue server!' + err)
      } else {
        conn.createChannel((err, ch) => {
          if (err) {
            reject('Unable to create channel with message queue!' + err)
          } else {
            resolve(ch)
          }
        })
      }
    })
  })
}

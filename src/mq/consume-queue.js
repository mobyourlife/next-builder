import { Observable } from 'rxjs/Observable'

export function consumeQueue(ch, queue_name) {
  ch.assertQueue(queue_name, {durable: true})

  return Observable.create(observer => {
    ch.consume(queue_name, msg => {
      try {
        const data = JSON.parse(msg.content.toString())
        console.log('Consuming', Array.isArray(data) ? data.length : 1, 'items from the queue')
        observer.next({
          data: data,
          ack: () => ch.ack(msg)
        })
      } catch (err) {
        console.error(`Fatal error trying consume message from queue ${queue_name}!`)
        console.error(err)
      }
    })
  })
}

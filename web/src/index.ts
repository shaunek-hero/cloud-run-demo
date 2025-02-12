import { Hono } from 'hono'
// import { HTTPException } from 'hono/http-exception';
import { PubSub } from '@google-cloud/pubsub';

const app = new Hono();
const pubSubClient = new PubSub();
const topic = 'demo-topic';

let counter = 0;

app.get('/', (c) => {
  return c.text('Hello Hono!')
})
  // .onError((error, c) => {
  //   if (error instanceof HTTPException) {
  //     return error.getResponse();
  //   }
  //   return c.json({ error: 'Internal Server Error' }, 500);
  // })
  .post('/pubsub/subscriber', async (c) => {
    const startTime = new Date();
    const body = await c.req.json();
    const msg = atob(body.message.data || '');
    console.log(`Recieved message payload on /pubsub/subscriber. Msg: ${msg}, Full payload: ${JSON.stringify(body)}`);
    counter++;
    if (counter % 2 === 0) {
      console.log(`Sleeping for a bit`);
      await Bun.sleep(5000);
    }
    const endTime = new Date();
    const ms = endTime.getTime() - startTime.getTime();
    console.log(`Took ${ms} to process`);
    return c.json({ thedata: body });
  })
  .post('/pubsub/publish', async (c) => {
    try {
      const json = await c.req.json();
      console.log('About to publish this message:', json);
      const msg = {
        "test": "This is a test!",
        "date": Date.now().toString(),
        "payload": json,
      };
      await publish(topic, JSON.stringify(msg));
      return c.text(`Message published to ${topic}`);
    } catch (error) {
      console.error('Encountered problem publishing message. ', Bun.inspect(error));
      throw error;
    }
  });

async function publish(topicNameOrId: string, data: string) {
  const dataBuffer = Buffer.from(data);
  const topic = pubSubClient.topic(topicNameOrId);

  try {
    const messageId = await topic.publishMessage({ data: dataBuffer });
    console.log(`Message ${messageId} published`);
  } catch (error) {
    console.error(`Received error while publishing: ${(error as Error).message}`);
  }
}


export default app;

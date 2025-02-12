import { Hono } from 'hono'
// import { HTTPException } from 'hono/http-exception';
import { PubSub } from '@google-cloud/pubsub';

const app = new Hono();
const pubSubClient = new PubSub();

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
    const body = await c.req.json();
    console.log('Recieved message on /pubsub/subscriber', body);
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
      await publish('demo-topic', JSON.stringify(msg));
      return c.text('Okay');
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

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
    const msgAsJson = JSON.parse(msg);
    console.log(`Recieved message payload on /pubsub/subscriber. Msg: ${msg}, Full payload: ${JSON.stringify(body)}`);
    if (msgAsJson && msgAsJson.forceDeadLetter == "yes") {
      console.log('This one is a dead letter test, returning error status code');
      throw new Error('Bruh this is a dead letter test');
    }
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
      console.log('About to publish this message:', JSON.stringify(json));
      const msg = {
        "test": "This is a test!",
        "date": Date.now().toString(),
        "payload": json,
      };
      const orderingKey = json.orderingKey || undefined;
      const multiplier = parseInt(json.multiplier) || 1;
      for (let i = 0; i < multiplier; i++) {
        const thisMsg = { ...msg, multiplierCounter: i + 1 };
        await publish(topic, JSON.stringify(thisMsg), orderingKey);
      }
      return c.text(`Published ${multiplier} message(s) to topic "${topic}"`);
    } catch (error) {
      console.error('Encountered problem publishing message. ', Bun.inspect(error));
      throw error;
    }
  });

async function publish(topicNameOrId: string, data: string, orderingKey: string | undefined) {
  const dataBuffer = Buffer.from(data);
  const topic = pubSubClient.topic(topicNameOrId);
  const payload = {
    data: dataBuffer,
    orderingKey: orderingKey,
  };

  try {
    const messageId = await topic.publishMessage(payload);
    console.log(`Message ${messageId} published`);
  } catch (error) {
    console.error(`Received error while publishing: ${(error as Error).message}`);
  }
}


export default app;

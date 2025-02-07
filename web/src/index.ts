import { Hono } from 'hono'
// import { HTTPException } from 'hono/http-exception';

const app = new Hono();

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
      return c.text('Okay');
    } catch (error) {
      console.error('Encountered problem publishing message. ', Bun.inspect(error));
      throw error;
    }
  });


export default app;

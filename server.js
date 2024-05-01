import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import NodeCache from 'node-cache';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
/* app.use(cors({
  origin: 'http://localhost:3000' // Replace with your frontend's URL
})); */

app.use(express.json());

const myCache = new NodeCache({
  stdTTL: 3600, // standard time to live in seconds
  checkperiod: 120
});

app.get('/', (req, res) => {
  res.status(200).send({
    message: 'Welcome to the chatbot server side!'
  });
});

app.post('/', async (req, res) => {
  try {
    const { prompt, langModel, temperature, maxTokens, impersonation } = req.body;
    const msg = impersonation ? `pretend you are ${impersonation}, ${prompt}` : prompt;
    const cacheKey = [prompt, langModel, temperature, maxTokens, impersonation].join('-').replace(/\s+/g, '-').toLowerCase();

    let cachedValue = myCache.get(cacheKey);

    if (cachedValue) {
      res.status(200).send({
        bot: cachedValue
      });
    } else {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: msg }],
        max_tokens: maxTokens,
        temperature: temperature
      });

      const botMsg = response.data.choices[0].message.content;

      myCache.set(cacheKey, botMsg);

      res.status(200).send({
        bot: botMsg
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`AI server already started at the back-end on port ${port}`));

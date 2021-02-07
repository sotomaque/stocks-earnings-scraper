import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

const app = express();
app.use(express.json());

app.listen(3001, () => {
  console.log('listening on 3001');
});

let globalRes = [];
for (let i = 2; i < 6; i++) {
  let day = i;
  const siteUrl = `https://www.earningswhispers.com/calendar?sb=p&d=${day}&t=all&v=s`;
  const fetchData = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data, {
      xml: {
        xmlMode: true,
        decodeEntities: true, // Decode HTML entities.
        withStartIndices: false, // Add a `startIndex` property to nodes.
        withEndIndices: false, // Add an `endIndex` property to nodes.
      },
    });
  };
  const $ = await fetchData();
  const getResults = async () => {
    const tickers = [];
    const time = [];
    const estimate = [];
    const revest = [];
    const $ = await fetchData();
    let date = new Date($('#calbox').text());
    $('.ticker', '#epscalendar').each((_, element) => {
      tickers.push($(element).text());
    });
    $('.time', '#epscalendar').each((_, element) => {
      time.push($(element).text());
    });
    $('.estimate', '#epscalendar').each((_, element) => {
      estimate.push($(element).text());
    });
    $('.revest', '#epscalendar').each((_, element) => {
      revest.push($(element).text());
    });

    const res = {};
    tickers.forEach((ticker, index) => {
      res[ticker] = {
        time: time[index],
        estimate: estimate[index],
        revenue: revest[index],
      };
    });

    let output = {
      date,
      res,
    };

    return output;
  };
  const res = await getResults();
  globalRes.push(res);
}
console.table(globalRes);
const DATA_DIR = './src/earnings';
const FILENAME = 'test';
const destinationFile = `${DATA_DIR}/${FILENAME}.txt`;
try {
  fs.writeFileSync(destinationFile, JSON.stringify(globalRes));
  console.log('success');
} catch (e) {
  console.log('Cannot write file ', e);
}

app.get('/earnings', (req, res) => {
  try {
    const data = fs.readFileSync(destinationFile);
    return res.status(200).json(JSON.parse(data));
  } catch (error) {
    console.error('error', error);
    res.send('null');
  }
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Setup DataBase
var mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
let UrlData = mongoose.model('UrlData', new Schema({
  url: String,
  short_url: Number,
}))

const createShort = (target_url, done) => {
  var new_url = new UrlData();
  new_url.url = target_url;
  UrlData.findOne().sort({ short_url: -1 }).exec((err, data) => {
    if(data){
      new_url.short_url = data.short_url + 1;
      new_url.save();
      done(null, new_url)
    } else {
      new_url.short_url = 1;
      new_url.save();
      done(null, new_url)
    }
  });
}

const getByName = (target_url, done) => {
  UrlData.findOne({ url: target_url }, (err, data) => {
    done(null, data)
  });
}

const getByShort = (target_id, done) => {
  UrlData.findOne({short_url: target_id}, (err, data) => {
    done(null, data)
  })
}

// Your first API endpoint
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.post('/api/shorturl', (req, res) => {
  var url = req.body.url
  if(/\/$/.test(url)) { url = url.slice(0,-1);}
  dns.lookup(dns_url(url), {}, (err, address, family) => {
    if (err || !(/^http/.test(url))) {
      res.json({ error: 'Invalid URL' })
      return
    }
    getByName(url, (err, data) => {
      if(!data){
        createShort(url, (err, data) => {
          res.json({ original_url: url, short_url: data.short_url })
        })
      } else {
        res.json({ original_url: url, short_url: data.short_url })
      }
    })
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  getByShort(req.params.short_url, (err, data) => {
    if(!data){
      res.json({error:	"No short URL found for the given input"})
    } else {
      res.redirect(data.url)
    }
  })
})

app.get('*', (req, res) => {
  res.sendStatus(404);
})

dns_url = (url) => {
  url = url.replace("https://", '');
  url = url.replace("http://", '');
  return url;
}

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

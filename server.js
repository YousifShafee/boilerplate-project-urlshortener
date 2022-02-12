require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().array());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Setup DataBase
var mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
let Shortener = mongoose.model('Shortener', new Schema({
  original_url: String,
  short_url: Number,
}))

const createShort = (target_url, done) => {
  var new_url = new Shortener();
  new_url.original_url = target_url;
  Shortener.findOne().sort({ short_url: -1 }).exec((err, last_url) => {
    if(err) {
      done(err, null)
      return
    }
    else if(last_url){
      new_url.short_url = last_url.short_url + 1;
    } else {
      new_url.short_url = 1;
    }
    new_url.save((err, data) => {
      done(err, data)
    })
  });
}

const getByName = (target_url, done) => {
  Shortener.findOne({ original_url: target_url }, (err, data) => {
    done(err, data)
  });
}

const getByShort = (target_id, done) => {
  Shortener.findOne({short_url: target_id}, (err, data) => {
    done(err, data)
  })
}

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  var url = req.body.url
  if(/\/$/.test(url)) { url = url.slice(0,-1);}
  dns.lookup(dns_url(url), {},(err, address, family) => {
    if (!(/^http/.test(url))) {
      res.json({ error: 'Invalid URL' })
      return
    }
    getByName(url, (err, data) => {
      if(err || !data){
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
  console.log(req.params.short_url)
  getByShort(req.params.short_url, (err, data) => {
    if(!data){
      res.json({error: "No short URL found for the given input"})
    } else {
      res.redirect(data.original_url)
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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

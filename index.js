const builder = require('botbuilder')
const restify = require('restify')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('92eebfb88d814cf99943ec3da40a721f');

var newsSource;
var newsList = "";

var news_fields = {
  "title" : "",
  "value": "",
  "style" : ""
}

var latest_news = new Array();
latest_news = [news_fields];

const { GlipConnector } = require('botbuilder-glip')

dotenv.config()
let botsData = {}
const botsDataFile = path.join(__dirname, '.cache')
console.log("The Bot data file is :" + botsDataFile)
if (fs.existsSync(botsDataFile)) {
  botsData = JSON.parse(fs.readFileSync(botsDataFile, 'utf-8'))
  console.log('Reading the .Cache file')
} else {
    console.log('The .Cache File does not exists')
}

const server = restify.createServer()

server.use(restify.plugins.queryParser())
server.use(restify.plugins.bodyParser())

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url)
})

const connector = new GlipConnector({
  botLookup: (botId) => {
    const botEntry = botsData[botId]
    return botEntry
  },
  verificationToken: process.env.GLIP_BOT_VERIFICATION_TOKEN,
  clientId: process.env.GLIP_CLIENT_ID,
  clientSecret: process.env.GLIP_CLIENT_SECRET,
  server: process.env.GLIP_API_SERVER,
  redirectUrl: `${process.env.GLIP_BOT_SERVER}/oauth`,
  webhookUrl: `${process.env.GLIP_BOT_SERVER}/webhook`
})

// For public glip bot
server.get('/oauth', connector.listenOAuth())

//For private glip bot
server.post('/oauth', connector.listenOAuth())

console.log('Authentication Completed Sucessfully'); 

setTimeout(function () {
            server.post('/webhook', connector.listen())
            console.log('timeout completed'); 
}, 5000); 

console.log('After Calling Webhook Subscription'); 

const bot = new builder.UniversalBot(connector)

bot.on('installationUpdate', (event) => {
  console.log(`New bot installed: ${event.sourceEvent.TokenData.owner_id}`)

  botsData[event.sourceEvent.TokenData.owner_id] = {
    identity: event.address.bot,
    token: event.sourceEvent.TokenData
  }
  fs.writeFileSync(botsDataFile, JSON.stringify(botsData)) 
  // save token
  console.log("Saved the bot token to the file")
})

  

bot.dialog('/', function (session) {
  /////////////////////


  //// Adding the Logic for the the news from news Sources

  function showNews (source) {
    if (1===1) {

        ///// Top Headlines //////

        var news =  newsapi.v2.topHeadlines({
            sources: source,
            language: 'en'
          }).then(response => {
            console.log(response.author);
            
            /// Build up the attachment Card ///
             for (var i in response) {
                 console.log("The Value of i is :" + i);
                 console.log(response.articles.length);
                
             }

             
             
             for (i=0;i<response.articles.length;i++) {
                newsList = newsList+"• [" + response.articles[i].title + "]("+ response.articles[i].url +")"+"\n";
                console.log(response.articles[i].url);
             }
                         //latest_news.news_fields.title=response.articles[i].title;
                // latest_news.news_fields.value=response.articles[i].url;
                // latest_news.news_fields.style="Short";
               
                             ///////////End Building Card////


              session.send({
                text: 'Current News Headlines from : - ' + source ,
                attachments: [{
                  type: 'Card',
                  fallback: 'Text',
                  color: "#00ff2a",
                  text: newsList,
                  title: "Top Headlines",
                    footnote: {
                      "text": "News brought to you by News API",
                      "iconUri": "",
                      "time": ""
                    }
                }]
              })

             console.log(latest_news);
             newsList = " ";

          });
        console.log(typeof(news));



        ////// End Top Headlines ////

     

        



      // sendMail();
  
      }
      
}

  console.log('Get message from glip:', session.message)
  var msg = session.message.text;

  if (msg.toLocaleLowerCase()==='Help'.toLocaleLowerCase()) {

    session.send({
      text: 'Help Command',
      attachments: [{
        type: 'Card',
        fallback: 'Text',
        color: "#00ff2a",
        text: "",
        fields: [
          {
            "title": "News bot commands",
            "value": " For news from various sources type the source-type \n examples:\n abc-news\,\n financial-times,\n fortune,\n hacker-news,\n info-money,\n msnbc,\n techcrunch",
            "style": "Long"
          }],
          footnote: {
            "text": "News brought to you by News API",
            "iconUri": "",
            "time": ""
          }
      }]
    })

  } else if(msg.toLocaleLowerCase()==='abc-news'.toLocaleLowerCase()|| msg.toLocaleLowerCase()==='financial-times'.toLocaleLowerCase()
||msg.toLocaleLowerCase()==='fortune'.toLocaleLowerCase()||msg.toLocaleLowerCase()==='fortune'.toLocaleLowerCase()||msg.toLocaleLowerCase()==='hacker-news'.toLocaleLowerCase()|| 
msg.toLocaleLowerCase()==='info-money'.toLocaleLowerCase()||msg.toLocaleLowerCase()==='msnbc'.toLocaleLowerCase()|| msg.toLocaleLowerCase()==='techcrunch'.toLocaleLowerCase()) {

  showNews(msg.toLocaleLowerCase());

  } else {
    session.send("Please type Help to get the commands for news sources or directly type the news source");
  }

  
  //session.send("You said: %s", session.message.text)
});

var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var Slack = require('node-slack');
var SlackTime = require('./slackTime');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var router = express.Router();

router.post('/', function(req, res) {
    var slackTime = SlackTime.processRequest(req.body.text);
    var slack = new Slack(req.body.response_url);
    var reply = slack.respond(req.body, function(hook) {

        return {
            text: slackTime,
            response_type: "ephemeral",
            username: 'What Time Is?',
        };

    });

    res.json(reply);
});

app.use('/api', router);

app.listen(port);
console.log('API server listening on port ' + port);

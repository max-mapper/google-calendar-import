this runs on a cron and gets a google calendars events so you can write them to a github repo as JSON

# setup

- create desktop app on google oauth with gcal enabled. create consent screen with your email listed as a test user. download credentials as JSON. run `token.js` to generate token.json. set credentials and token json env vars on github action.
const { google } = require('googleapis')

const getToken = () => {
  const token = process.env['TOKEN']
  if (token) try { return JSON.parse(token) } catch (e) { throw new Error(`Failed to parse token: ${e}`) }
  throw new Error('Missing Token')
}

const getCredentials = () => {
  const token = process.env['CREDENTIALS']
  if (token) try { return JSON.parse(token) } catch (e) { throw new Error(`Failed to parse credentials: ${e}`) }
  throw new Error('Missing Credentials')
}

const getOAuth2Client = (token, credentials) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
  oAuth2Client.setCredentials(token)
  return oAuth2Client
}

const token = getToken()
const creds = getCredentials()
const client = getOAuth2Client(token, creds)
const calendarId = process.argv[2]

const calendar = google.calendar({ version: 'v3', auth: client })

calendar.events.list({
  calendarId: calendarId,
  timeMin: (new Date()).toISOString(),
  maxResults: 100,
  singleEvents: true,
  orderBy: 'startTime',
  }, async (err, res) => {
  if (err) throw err
  const events = res.data.items
  if (events.length) {
    // events.map((event, i) => {
    //     const start = event.start.dateTime || event.start.date
    //     console.log(start)
    // })
    console.log(JSON.stringify(events, null, '  '))
  } else {
    console.log('No upcoming events found.')
  }
  })

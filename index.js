const core = require('@actions/core')

const run = async () => {
  try {
    const creds = getToken()
    const token = getCredentials()
    const client = getOAuth2Client(token, creds)
    const calendar = google.calendar({ version: 'v3', auth: client })
    const calendarId = core.getInput('calendar-id')

    calendar.events.list({
      calendarId: calendarId,
      timeMin: (new Date()).toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) return core.error('The API returned an error: ' + err)
      const events = res.data.items
      if (events.length) {
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date
          core.info(`${start} - ${event.summary}`)
        })
      } else {
        core.info('No upcoming events found.')
      }
    })

    core.info(`Running action`)
  } catch (err) {
    core.error(err.message)
  }
}

const getToken = () => {
  const token = core.getInput('google-token')
  if (token) try { return JSON.parse(token) } catch (e) { throw new Error(`Failed to parse token: ${e}`) }
  throw new Error('Missing Token')
}

const getCredentials = () => {
  const token = core.getInput('google-credentials')
  if (token) try { return JSON.parse(token) } catch (e) { throw new Error(`Failed to parse credentials: ${e}`) }
  throw new Error('Missing Credentials')
}

const getOAuth2Client = (token, credentials) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0])
  oAuth2Client.setCredentials(token)
  return oAuth2Client
}

run()
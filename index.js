const core = require('@actions/core')
const { google } = require('googleapis')
const { Octokit } = require("@octokit/rest")

const run = async () => {
  try {
    const token = getToken()
    const creds = getCredentials()
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
        await saveToFile(events)
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

const saveToFile = async (obj) => {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  })
  const username = process.env.GITHUB_REPOSITORY.split("/")[0]
  const repo = process.env.GITHUB_REPOSITORY.split("/")[1]
  const contentEncoded = Buffer.from(JSON.stringify(obj)).toString('base64')
  const { data } = await octokit.repos.createOrUpdateFileContents({
    // replace the owner and email with your own details
    owner: username,
    repo: repo,
    path: "test.json",
    message: "Updated json programatically",
    content: contentEncoded,
    committer: {
      name: `Octokit Bot`,
      email: "octokit@example.com",
    },
    author: {
      name: "Octokit Bot",
      email: "octokit@example.com",
    },
  })
  return data
}

run()
const core = require('@actions/core')
const { google } = require('googleapis')
const { Octokit } = require("@octokit/rest")

const run = async () => {
  try {
    const jsonPath = core.getInput('json-path')
    const repoToken = core.getInput('repo-token')
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
    }, async (err, res) => {
      if (err) return core.error('The API returned an error: ' + err)
      const events = res.data.items
      if (events.length) {
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date
          core.info(`${start} - ${event.summary}`)
        })
        await saveToFile(repoToken, events, jsonPath)
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

const saveToFile = async (repoToken, events, jsonPath) => {
  const octokit = new Octokit({
    auth: repoToken,
  })
  const username = process.env.GITHUB_REPOSITORY.split("/")[0]
  const repo = process.env.GITHUB_REPOSITORY.split("/")[1]
  let options = {
    // replace the owner and email with your own details
    owner: username,
    repo: repo,
    path: jsonPath,
    message: "Updated json programatically",
    content: '',
    committer: {
      name: `Octokit Bot`,
      email: "octokit@example.com",
    },
    author: {
      name: "Octokit Bot",
      email: "octokit@example.com",
    },
  }

  let existingEvents = { events: [] }
  try {
     // get existing file so we can merge data in
    const { data } = await octokit.repos.getContent({
      owner: options.owner,
      repo: options.repo,
      path: options.path,
    })
    options.sha = data.sha
    existingEvents = JSON.parse(Buffer.from(data.content, 'base64'))
  } catch (err) {
    core.error("Error getting content: " + err.message)
  }

  const linkRegex = /\b(https?):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|]/
  const existingEventsJsonBefore = JSON.stringify(existingEvents, null, '  ')

  // merge events using id as unique key
  events.forEach((event) => {
    let link
    let matches = event.description.match(linkRegex)
    if (matches) link = matches[0]
    const start = new Date(event.start.dateTime || event.start.date)
    let details = {
      name: event.summary,
      date: start,
      description: event.description,
      link,
      id: event.id
    }

    let exists = false
    existingEvents.events.forEach((existing) => {
      if (existing.id === details.id) {
        exists = true
        existing.name = details.name
        existing.date = details.date
        existing.description = details.description
        existing.link = details.link
      }
    })

    if (!exists) existingEvents.events.push(details)
  })

  existingEvents.events.sort((a, b) => b.date - a.date )
  
  const existingEventsJson = JSON.stringify(existingEvents, null, '  ')
  if (existingEventsJsonBefore === existingEventsJson) return

  options.content = Buffer.from(existingEventsJson).toString('base64')
  const { data2 } = await octokit.repos.createOrUpdateFileContents(options)  
  return data2
}

run()
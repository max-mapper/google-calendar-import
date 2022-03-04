module.exports = (events, existingEvents) => {
  const linkRegex = /\b(https?):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|]/

  let cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() + 3)

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

  // delete past events and >3 months in future events
  existingEvents.events = existingEvents.events
    .filter(ev => ev.date > new Date())
    .filter(ev => ev.date < cutoffDate)

  existingEvents.events.sort((a, b) => {
    let aId = JSON.stringify(a.date) + a.id
    let bId = JSON.stringify(b.date) + b.id
    return aId < bId
  })
}
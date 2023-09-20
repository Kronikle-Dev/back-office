
//import turndown from 'turndown'
import { DateTime } from 'luxon'
import { NodeHtmlMarkdown } from 'node-html-markdown'

export default defineEventHandler(async (event): Promise<KImportEvent>  => {
  // @ts-ignore
  const eventId = event.context.params.eventId

  let nbevents = 0
  let initialfetchurl = `https://sygefor.reseau-urfist.fr/api/training/${eventId}`
  
  let events = null
  let errorstep = 'initial fetch'
  
  try {
    const res = await fetch(initialfetchurl)
    const event = await res.json()
    const dates = event.sessions.map((session: any): KDate => {
      let isDistanciel = false
      let isPresentiel = false
      let attendanceMode = ''
      if (session.rooms.find((room: any) => room.slug.includes('virtual'))) {
        isDistanciel = true
      }
      if (session.rooms.find((room: any) => room.slug.includes('physical'))) {
        isPresentiel = true
      }
      if (isDistanciel && isPresentiel) {
        attendanceMode = 'mixed'
      } else if (isDistanciel) {
        attendanceMode = 'online'
      } else if (isPresentiel) {
        attendanceMode = 'offline'
      }
      let beginHour = 0
      let beginMinute = 0
      let endHour = 0
      let endMinute = 0
      if (!session.hourBegin && session.schedule) {
        beginHour = Number.parseInt(session.schedule.split('-')[0].split('h')[0])
        beginMinute = Number.parseInt(session.schedule.split('-')[0].split('h')[1])
      }
      if (!session.hourEnd && session.schedule) {
        endHour = Number.parseInt(session.schedule.split('-')[1].split('h')[0])
        endMinute = Number.parseInt(session.schedule.split('-')[1].split('h')[1])
      }
      if (session.hourBegin) {
        beginHour = DateTime.fromISO(session.hourBegin).hour
        beginMinute = DateTime.fromISO(session.hourBegin).minute
      }
      if (session.hourEnd) {
        endHour = DateTime.fromISO(session.hourEnd).hour
        endMinute = DateTime.fromISO(session.hourEnd).minute
      }


      const startDateTime = DateTime.fromISO(session.dateBegin).set({hour: beginHour || 0, minute: beginMinute || 0})
      const endDateTime = DateTime.fromISO(session.dateEnd).set({hour: endHour || 0, minute: endMinute || 0})

      return {
        eventId: '',
        startDateTime: startDateTime.toJSDate(),
        endDateTime: endDateTime.toJSDate(),
        placeName: session.physicalRoom?.room || '',
        placeDescription: session.physicalRoom?.name || '',
        maxAttendeeCapacity: session?.maximumNumberOfRegistrations || null,
        attendanceMode: attendanceMode,
        mandatoryRegistration: false,
        accessibility: '',
        status: 'valid',
      }
    })

    const rawDescription = event.program || event.objectives || ''
    //const turndownService = new turndown()
    //const parsedDescription = turndownService.turndown(rawDescription)
    const parsedDescription = NodeHtmlMarkdown.translate(
      /* html */ rawDescription, 
      /* options (optional) */ {}, 
      /* customTranslators (optional) */ undefined,
      /* customCodeBlockTranslators (optional) */ undefined
    );

    return {
      event: {
        name: event.name,
        description: parsedDescription,
        creationDate: new Date(),
        updateDate: new Date(),
        status: 'published',
        author: '',
        originId: `${event.id}`,
        minAge: null,
        maxAge: null,
        price: null,
        url: null,
        tags: [],
        publicTypes: [],
        eventType: [],
      },
      dates: dates,
      tags: event?.tags?.map((tag: {name: string}) => {
        return tag.name
      }) || [],
      publicTypes: event?.publicTypes?.map((type: {name: string}) => {
        return type.name
      }) || [],
      eventTypes: [event.typeLabel],
    }

  } catch (e) {
    console.error(e)
    return {
      event: null,
      dates: [],
      tags: [],
      publicTypes: [],
      eventTypes: [],
      error: `Error during ${errorstep}: ${e}`
    }
  }

})
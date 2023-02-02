
import config from '../SygeforImporterConfig.js'
import turndown from 'turndown'

export default defineEventHandler(async (event): Promise<KImportEvent>  => {
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
      return {
        eventId: '',
        startDateTime: new Date(session.dateBegin),
        endDateTime: new Date(session.dateEnd),
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
    const turndownService = new turndown()
    const parsedDescription = turndownService.turndown(rawDescription)

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

import config from './SygeforImporterConfig.js'

export default defineEventHandler(async (event) : Promise<ThirdPartyEvent[] | any> => {
  let queryObject = ''
  const query = getQuery(event)
  const queryString = query.query as string

  if (queryString && queryString.length > 0) {
    queryObject = `
      ,"query": {
        "filtered": {
          "query": {
            "query_string": {
              "query": "${queryString}"
            }
          }
        }
      }`
  }

  let nbevents = 0
  let initialfetchurl = `https://sygefor.reseau-urfist.fr/api/training`
  const optionsFact = function (organizationId: Number, from: Number, size: Number, queryObject: String) {
    return {
      "method": 'POST',
      "headers": {'Content-Type': 'application/json'},
      "body": `{
        "size":${size},
        "from":${from},
        "aggs": {
            "organization.id": {
                "terms": {
                  "field":"organization.id",
                  "order":{
                    "_term":"asc"
                  }
                }
              }
            },
            "post_filter":{
              "term":{
                "organization.id":${organizationId}
              }
            }${queryObject}
          }`
    }
  }
  
  let events = null
  let errorstep = 'initial fetch'
  
  const initialoptions = optionsFact(config.organizationId, 0, 0, '')
  try {
    const res = await fetch(initialfetchurl, initialoptions)
    const body = await res.json()

    let totalEventsToImport = body.total
    errorstep = 'second fetch'
    if (totalEventsToImport > 0) {
      nbevents = totalEventsToImport
      const options = optionsFact(config.organizationId, 0, nbevents, queryObject)
      const eventsResp = await fetch(initialfetchurl, options )
      const eventsJson = await eventsResp.json()
      const mapped: ThirdPartyEvent[] = eventsJson.items.map((event: any) : ThirdPartyEvent => {
        return {
          name: event.name,
          id: event.id,
          description: event.objectives,
          // Sessions les plus récentes en premier
          date: (event.sessions ?? [])
            .map((session: any): Date => new Date(session.dateBegin))
            .sort((a: Date, b: Date) => b.getTime() - a.getTime())
        }
      })
      // Événements triés par date décroissante (session la plus récente) ;
      // ceux sans session passent en fin de liste.
      const latest = (e: ThirdPartyEvent) => e.date[0]?.getTime() ?? -Infinity
      return mapped.sort((a, b) => latest(b) - latest(a))
    } else {
      console.error(body)
      throw new Error('Could not import events from Sygefor API endpoint')
    }
  } catch (e: any) {
    console.error(e)
    return e
  }

})
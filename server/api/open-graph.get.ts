import ogs from 'open-graph-scraper'

export default defineEventHandler(async (event) : Promise<{ error?: string | undefined, og: any | null }> => {
  let queryObject = ''
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    return {
      error: 'No URL given',
      og: null
    }
  } else {
    try {
      const data = await ogs({url: url})
      if (data.error) {
        return {
          error: JSON.stringify(data.result),
          og: null
        }
      } else {
        return {
          og: data.result
        }
      }
    } catch (e) {
      return {
        error: `${e}`,
        og: null
      }
    }
  }
})


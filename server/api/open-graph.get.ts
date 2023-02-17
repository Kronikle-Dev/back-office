import ogs from 'open-graph-scraper'

export default defineEventHandler(async (event) : Promise<{ error?: string | undefined, og: any | null, html: string | null }> => {
  let queryObject = ''
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    return {
      error: 'No URL given',
      og: null,
      html: null
    }
  } else if (url.includes('twitter.com/')) {
    try {
      const response = await fetch(`https://publish.twitter.com/oembed?url=${url}`)
      const respJson = await response.json()
      const originalHTml = respJson.html as unknown as string
      return {
        og: null,
        html: originalHTml
      }
    } catch (e) {
      return {
        error: JSON.stringify(e),
        og: null,
        html: null
      }
    }
  } else {
    try {
      const response = await fetch(url)
      //@ts-ignore
      const data = await ogs({html: (await response.text())})
      if (data.error) {
        return {
          error: JSON.stringify(data.result),
          og: null,
          html: null
        }
      } else {
        return {
          og: data.result,
          html: null
        }
      }
    } catch (e) {
      return {
        error: JSON.stringify(e),
        og: null,
        html: null
      }
    }
  }
})


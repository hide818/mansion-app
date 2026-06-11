import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TWEETS } from '@/lib/tweetQueue'

// Twitter API v2 で1ツイート投稿する
async function postTweet(text: string): Promise<{ id: string }> {
  const apiKey = process.env.TWITTER_API_KEY!
  const apiSecret = process.env.TWITTER_API_SECRET!
  const accessToken = process.env.TWITTER_ACCESS_TOKEN!
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET!

  // OAuth 1.0a 署名生成
  const oauth = await buildOAuthHeader('POST', 'https://api.twitter.com/2/tweets', {}, {
    apiKey, apiSecret, accessToken, accessTokenSecret,
  })

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': oauth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twitter API error ${res.status}: ${err}`)
  }

  const json = await res.json()
  return { id: json.data.id }
}

// OAuth 1.0a ヘッダー生成（外部ライブラリなしで実装）
async function buildOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  credentials: {
    apiKey: string
    apiSecret: string
    accessToken: string
    accessTokenSecret: string
  },
): Promise<string> {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  }

  const allParams = { ...params, ...oauthParams }
  const sortedKeys = Object.keys(allParams).sort()
  const paramString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&')

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join('&')

  const signingKey = `${encodeURIComponent(credentials.apiSecret)}&${encodeURIComponent(credentials.accessTokenSecret)}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(baseString))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

  oauthParams['oauth_signature'] = signatureB64

  const headerValue = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ')

  return headerValue
}

export async function GET(request: Request) {
  // cronキー認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requiredEnvs = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_TOKEN_SECRET',
  ]
  for (const key of requiredEnvs) {
    if (!process.env[key]) {
      return NextResponse.json({ error: `Missing env: ${key}` }, { status: 500 })
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 次に投稿するインデックスを取得
  const { data: setting } = await supabase
    .from('tweet_settings')
    .select('value')
    .eq('key', 'next_index')
    .maybeSingle()

  const nextIndex = setting ? parseInt(setting.value, 10) : 0
  const tweetIndex = nextIndex % TWEETS.length
  const tweetText = TWEETS[tweetIndex]

  try {
    const { id } = await postTweet(tweetText)

    // 投稿ログ保存
    await supabase.from('tweet_logs').insert({
      tweet_index: tweetIndex,
      tweet_text: tweetText,
      twitter_id: id,
      posted_at: new Date().toISOString(),
    })

    // 次のインデックスを更新
    await supabase.from('tweet_settings').upsert({
      key: 'next_index',
      value: (nextIndex + 1).toString(),
    })

    return NextResponse.json({ success: true, index: tweetIndex, id })
  } catch (error) {
    console.error('Tweet failed:', error)
    return NextResponse.json(
      { error: 'Tweet failed', detail: String(error) },
      { status: 500 },
    )
  }
}

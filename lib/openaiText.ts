export async function generateOpenAIText({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string
  userPrompt: string
}) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY が .env.local に設定されていません。')
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userPrompt,
            },
          ],
        },
      ],
      max_output_tokens: 1400,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI APIエラー: ${errorText}`)
  }

  const data = await response.json()

  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  const output = Array.isArray(data.output) ? data.output : []
  const texts: string[] = []

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : []
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        texts.push(part.text.trim())
      }
    }
  }

  const joined = texts.join('\n').trim()

  if (!joined) {
    throw new Error('AIの出力を取得できませんでした。')
  }

  return joined
}
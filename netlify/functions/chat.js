const config = {
  systemPrompt: "You are a helpful, friendly, and concise AI assistant. Respond in a conversational manner. Keep responses brief unless the user asks for detail.",
  apiEndpoint: "https://opencode.ai/zen/v1/chat/completions",
  defaultModel: "deepseek-v4-flash-free",
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages, model } = JSON.parse(event.body);
    const apiKey = process.env.OPENCODE_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    const requestBody = {
      model: model || config.defaultModel,
      messages: [
        { role: 'system', content: config.systemPrompt },
        ...messages,
      ],
    };

    const res = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: errText }) };
    }

    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

export default async function handler(req, res) {
  // CORS headers - パブリックアクセスを明示的に許可
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, conversation_id, user, botType } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // ボットタイプに応じてAPIキーを選択
    const apiKeyMap = {
      yamamoto: process.env.DIFY_API_KEY_YAMAMOTO,
      twitter: process.env.DIFY_API_KEY_TWITTER,
      facebook: process.env.DIFY_API_KEY_FACEBOOK,
      profile: process.env.DIFY_API_KEY_PROFILE
    };
    
    const apiKey = apiKeyMap[botType] || process.env.DIFY_API_KEY;
    if (!apiKey) {
      // APIキーが設定されていない場合でも、適切なメッセージを返す
      return res.status(200).json({
        answer: 'サービスの設定を確認中です。しばらくしてから再度お試しください。',
        conversation_id: conversation_id || 'temp-' + Date.now()
      });
    }

    const requestBody = {
      inputs: {},
      query: query,
      response_mode: 'blocking',
      user: user || 'user-' + Date.now()
    };

    if (conversation_id) {
      requestBody.conversation_id = conversation_id;
    }

    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // APIエラーの場合でも、ユーザーフレンドリーなメッセージを返す
      return res.status(200).json({
        answer: 'ただいまサービスが混雑しています。少し時間をおいてから再度お試しください。',
        conversation_id: conversation_id || 'temp-' + Date.now()
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);
    // エラーが発生した場合でも、ユーザーフレンドリーなメッセージを返す
    res.status(200).json({
      answer: '申し訳ございません。一時的にサービスにアクセスできません。しばらくしてから再度お試しください。',
      conversation_id: req.body.conversation_id || 'temp-' + Date.now()
    });
  }
}

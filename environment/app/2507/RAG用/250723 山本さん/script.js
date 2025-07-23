class DifyChatBot {
    constructor() {
        this.conversationId = '';
        this.isTyping = false;
        this.currentBotType = null;
        this.botConfigs = {
            yamamoto: {
                title: 'ビジネスサイボーグ 山本',
                initialMessage: `こんにちは！私はビジネスサイボーグの山本智也です。\n\nビジネスやマーケティングについて、聞きたいことがあれば、気軽にどんなことでも聞いてください。`,
                apiType: 'yamamoto'
            },
            twitter: {
                title: 'X投稿用アシスタント',
                initialMessage: `こんにちは！X（Twitter）投稿用のアシスタントです。\n\n効果的なツイート作成をお手伝いします。\n\n投稿したい内容やテーマを教えてください。ハッシュタグの提案も含めて最適な投稿文を作成します。`,
                apiType: 'twitter'
            },
            facebook: {
                title: 'Facebook投稿用アシスタント',
                initialMessage: `こんにちは！Facebook投稿用のアシスタントです。\n\nFacebookに適した投稿文の作成をサポートします。\n\n投稿したい内容やターゲット層を教えてください。エンゲージメントを高める投稿文を提案します。`,
                apiType: 'facebook'
            },
            profile: {
                title: 'プロフィール文作成アシスタント',
                initialMessage: `こんにちは！プロフィール文作成のアシスタントです。\n\n魅力的な自己紹介文やプロフィールの作成をお手伝いします。\n\nあなたの職業、経歴、特技、趣味などを教えてください。用途に合わせた最適なプロフィール文を作成します。`,
                apiType: 'profile'
            }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.focusInput();
    }

    loadSettings() {
        // サーバーサイドで管理されるため何もしない
    }

    saveSettings() {
        this.showSuccess('設定は自動で管理されています');
        setTimeout(() => {
            toggleSettings();
        }, 1500);
    }

    showError(message) {
        this.removeMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.appendChild(errorDiv);
        }

        setTimeout(() => {
            this.removeMessages();
        }, 3000);
    }

    showSuccess(message) {
        this.removeMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.appendChild(successDiv);
        }
    }

    removeMessages() {
        const existing = document.querySelectorAll('.error-message, .success-message');
        existing.forEach(el => el.remove());
    }

    setupEventListeners() {
        const input = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        input.addEventListener('input', () => {
            const hasText = input.value.trim().length > 0;
            sendButton.disabled = !hasText || this.isTyping;
        });
    }

    focusInput() {
        document.getElementById('message-input').focus();
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (!message || this.isTyping) return;

        input.value = '';
        document.getElementById('send-button').disabled = true;

        this.addMessage(message, 'user');
        this.showTypingIndicator();

        try {
            const response = await this.callDifyAPI(message);

            this.hideTypingIndicator();
            this.addMessage(response.answer, 'bot');

            if (response.conversation_id) {
                this.conversationId = response.conversation_id;
            }

        } catch (error) {
            console.error('送信エラー:', error);
            this.hideTypingIndicator();
            this.addMessage('申し訳ございません。メッセージの送信に失敗しました。しばらく時間をおいてから再度お試しください。', 'bot');
        } finally {
            this.isTyping = false;
            document.getElementById('send-button').disabled = false;
            this.focusInput();
        }
    }

    async callDifyAPI(message) {
        const requestBody = {
            query: message,
            user: 'user-' + Date.now(),
            botType: this.currentBotType
        };

        if (this.conversationId) {
            requestBody.conversation_id = this.conversationId;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            // レスポンスが正常な形式かチェック
            if (data && data.answer) {
                return data;
            } else {
                // フォールバック応答
                return {
                    answer: 'ただいまサービスが混雑しています。少し時間をおいてから再度お試しください。',
                    conversation_id: this.conversationId || 'temp-' + Date.now()
                };
            }
        } catch (error) {
            console.warn('API通信エラー:', error);
            // ネットワークエラーの場合のフォールバック
            return {
                answer: '申し訳ございません。現在サービスが利用できません。インターネット接続を確認して、少し時間をおいてから再度お試しください。',
                conversation_id: this.conversationId || 'temp-' + Date.now()
            };
        }
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        document.getElementById('chat-messages').appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.message.typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // HTMLエスケープ関数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

        // テキストをHTMLフォーマットに変換
    formatText(text) {
        // HTMLエスケープ
        let formattedText = this.escapeHtml(text);

        // 句読点の後に改行を追加（。！？の後）
        formattedText = formattedText.replace(/([。！？])\s*/g, '$1<br>');

        // 既存の改行をブレークタグに変換
        formattedText = formattedText.replace(/\n/g, '<br>');

        // 複数の連続する<br>を整理
        formattedText = formattedText.replace(/(<br>\s*){3,}/g, '<br><br>');

        // 箇条書きの処理
        const lines = formattedText.split('<br>');
        let result = [];
        let inList = false;

        for (let line of lines) {
            const trimmedLine = line.trim();

            // 箇条書きの開始を検出（-, ・, •, *, + で始まる行）
            if (trimmedLine.match(/^[-・•*+]\s+/)) {
                if (!inList) {
                    result.push('<ul class="message-list">');
                    inList = true;
                }
                // 箇条書きマーカーを除去してリストアイテムに変換
                const content = trimmedLine.replace(/^[-・•*+]\s+/, '');
                result.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                if (trimmedLine !== '') {
                    result.push(line);
                }
            }
        }

        // リストが開いたままの場合は閉じる
        if (inList) {
            result.push('</ul>');
        }

        return result.join('<br>').replace(/<br><ul>/g, '<ul>').replace(/<\/ul><br>/g, '</ul>');
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // フォーマットされたHTMLを使用
        contentDiv.innerHTML = this.formatText(text);

        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);

        this.scrollToBottom();
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    clearChat() {
        if (confirm('チャット履歴をクリアしますか？')) {
            document.getElementById('chat-messages').innerHTML = '';
            this.conversationId = '';
            if (this.currentBotType) {
                const config = this.botConfigs[this.currentBotType];
                this.addMessage(config.initialMessage, 'bot');
            }
            this.focusInput();
        }
    }

    selectBot(botType) {
        this.currentBotType = botType;
        const config = this.botConfigs[botType];
        
        // タイトルを更新
        document.getElementById('chat-title').textContent = config.title;
        
        // 画面を切り替え
        document.getElementById('bot-selection-screen').style.display = 'none';
        document.getElementById('chat-container').style.display = 'flex';
        
        // チャットをクリア
        document.getElementById('chat-messages').innerHTML = '';
        this.conversationId = '';
        
        // 初期メッセージを表示
        this.addMessage(config.initialMessage, 'bot');
        
        // 入力欄にフォーカス
        this.focusInput();
    }
}

function toggleSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    const overlay = document.getElementById('overlay');

    const isActive = settingsPanel.classList.contains('active');

    if (isActive) {
        settingsPanel.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        settingsPanel.classList.add('active');
        overlay.classList.add('active');
    }
}

function saveSettings() {
    window.difyChatBot.saveSettings();
}

function clearChat() {
    window.difyChatBot.clearChat();
}

function showBotSelection() {
    document.getElementById('chat-container').style.display = 'none';
    document.getElementById('bot-selection-screen').style.display = 'flex';
    window.difyChatBot.currentBotType = null;
}

document.addEventListener('DOMContentLoaded', () => {
    window.difyChatBot = new DifyChatBot();

    // ボット選択のイベントリスナーを設定
    const botOptions = document.querySelectorAll('.bot-option');
    botOptions.forEach(option => {
        option.addEventListener('click', () => {
            const botType = option.getAttribute('data-bot-type');
            window.difyChatBot.selectBot(botType);
        });
    });

    // 初期状態はボット選択画面を表示
    document.getElementById('bot-selection-screen').style.display = 'flex';
    document.getElementById('chat-container').style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel.classList.contains('active')) {
            toggleSettings();
        }
    }
});

class DifyChatBot {
    constructor() {
        this.apiUrl = 'https://api.dify.ai/v1/chat-messages';
        this.apiKey = config.DIFY_API_KEY;
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.conversationId = '';
        this.userId = 'user-' + Date.now();
        
        this.init();
    }

    init() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.setLoading(true);

        try {
            await this.callDifyAPI(message);
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('申し訳ございません。エラーが発生しました。', 'bot');
        } finally {
            this.setLoading(false);
        }
    }

    async callDifyAPI(message) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                inputs: {},
                query: message,
                response_mode: 'streaming',
                conversation_id: this.conversationId,
                user: this.userId,
                auto_generate_name: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return this.handleStreamingResponse(response);
    }

    async handleStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let currentMessageDiv = null;
        let currentMessageContent = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            switch (data.event) {
                                case 'message':
                                    if (!currentMessageDiv) {
                                        currentMessageDiv = this.createBotMessage();
                                        this.chatMessages.appendChild(currentMessageDiv);
                                    }
                                    currentMessageContent += data.answer;
                                    currentMessageDiv.querySelector('.message-bubble p').textContent = currentMessageContent;
                                    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                                    break;
                                    
                                case 'message_end':
                                    if (data.conversation_id) {
                                        this.conversationId = data.conversation_id;
                                    }
                                    currentMessageDiv = null;
                                    currentMessageContent = '';
                                    break;
                                    
                                case 'error':
                                    throw new Error(data.message);
                            }
                        } catch (parseError) {
                            console.error('Parse error:', parseError);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    createBotMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'bot-avatar';
        avatar.textContent = '👨‍💼';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble bot-bubble';
        
        const content = document.createElement('p');
        bubble.appendChild(content);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        
        return messageDiv;
    }

    createUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble user-bubble';
        
        const content = document.createElement('p');
        content.textContent = text;
        bubble.appendChild(content);
        
        messageDiv.appendChild(bubble);
        
        return messageDiv;
    }

    addMessage(content, type) {
        let messageDiv;
        
        if (type === 'user') {
            messageDiv = this.createUserMessage(content);
        } else {
            messageDiv = this.createBotMessage();
            messageDiv.querySelector('.message-bubble p').textContent = content;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    setLoading(isLoading) {
        this.sendButton.disabled = isLoading;
        this.messageInput.disabled = isLoading;
        
        if (isLoading) {
            const loadingDiv = this.createBotMessage();
            loadingDiv.id = 'loading-message';
            loadingDiv.querySelector('.message-bubble').innerHTML = '<div class="loading"></div>';
            this.chatMessages.appendChild(loadingDiv);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        } else {
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DifyChatBot();
});
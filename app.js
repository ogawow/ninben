const { useState, useEffect, useRef } = React;

// React 18用のcreateRootを使用
const root = ReactDOM.createRoot(document.getElementById('root'));

function LoadingDots() {
    return (
        <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );
}

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const userAgent = window.navigator.userAgent;
        const deviceType = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(userAgent) ? 'モバイル' : 'デスクトップ';
        const browserName = getBrowserName(userAgent);

        const initialMessage = `${deviceType}の${browserName}ブラウザでお越しいただき、ありがとうございます！
ninben.aiへようこそ。あなたの仕事をLINEとAIで奪ってみませんか？`;

        setMessages([{ role: 'assistant', content: initialMessage }]);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getBrowserName = (userAgent) => {
        if (userAgent.indexOf("Chrome") > -1) return "Chrome";
        if (userAgent.indexOf("Safari") > -1) return "Safari";
        if (userAgent.indexOf("Firefox") > -1) return "Firefox";
        if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) return "Internet Explorer";
        if (userAgent.indexOf("Edge") > -1) return "Edge";
        return "不明なブラウザ";
    };

    const handleSend = async () => {
        if (input.trim() === '') return;

        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');

        try {
            const response = await fetch('https://api.dify.ai/v1/chat-messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.DIFY_API_KEY}`
                },
                body: JSON.stringify({
                    inputs: {},
                    query: input,
                    response_mode: 'blocking',
                    conversation_id: '',
                    user: 'user'
                })
            });

            if (!response.ok) {
                throw new Error('APIリクエストが失敗しました');
            }

            const data = await response.json();
            
            // レスポンスの解析と処理
            try {
                const parsedData = typeof data.answer === 'string' ? JSON.parse(data.answer) : data.answer;
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: parsedData.answer || parsedData
                }]);
                
                if (parsedData.suggested_questions) {
                    setSuggestedQuestions(parsedData.suggested_questions.slice(0, 4));
                }
            } catch (e) {
                // JSONとして解析できない場合は、通常のテキストとして扱う
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: data.answer
                }]);
            }
        } catch (error) {
            console.error('エラー:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickReplies = [
        { label: 'サービス概要', content: 'ninben.aiのサービス概要を教えてください' },
        { label: '料金プラン', content: 'ninben.aiの料金プランについて教えてください' },
        { label: '導入事例', content: 'ninben.aiの導入事例を教えてください' },
        { label: 'お問い合わせ', content: 'ninben.aiへのお問い合わせ方法を教えてください' }
    ];

    return (
        <div className="container">
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">ninben.ai</h1>
                </div>
                <div className="card-content">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                            {msg.content}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message assistant-message">
                            <LoadingDots />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="card-footer">
                    <div className="quick-replies">
                        {quickReplies.map((reply, index) => (
                            <button
                                key={index}
                                className="quick-reply-button"
                                onClick={() => setInput(reply.content)}
                            >
                                {reply.label}
                            </button>
                        ))}
                    </div>
                    {suggestedQuestions.length > 0 && (
                        <div className="suggested-questions">
                            <p>関連する質問：</p>
                            <div className="grid grid-cols-2 gap-2">
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        className="quick-reply-button suggested"
                                        onClick={() => {
                                            setInput(question);
                                            setSuggestedQuestions([]);
                                        }}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="input-group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="メッセージを入力..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} disabled={isLoading}>
                            送信
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// React 18のレンダリング方法を使用
root.render(<App />);

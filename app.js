const { useState, useEffect, useRef } = React;

// カルーセルコンポーネント
function ImageCarousel({ images }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((current) => (current + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <div className="carousel">
            <div className="carousel-container">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="carousel-slide"
                        style={{
                            transform: `translateX(${100 * (index - currentIndex)}%)`,
                            opacity: index === currentIndex ? 1 : 0
                        }}
                    >
                        <img src={image.url} alt={image.alt} />
                    </div>
                ))}
            </div>
            <div className="carousel-indicators">
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
}

// ローディングドットコンポーネント
function LoadingDots() {
    return (
        <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );
}

// メインアプリケーション
function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [showCarousel, setShowCarousel] = useState(false);

    // サービス紹介用の画像
    const serviceImages = [
        { 
            url: 'images/service-1.jpg', 
            alt: 'ninben.ai サービス概要 1' 
        },
        { 
            url: 'images/service-2.jpg', 
            alt: 'ninben.ai サービス概要 2' 
        },
        { 
            url: 'images/service-3.jpg', 
            alt: 'ninben.ai サービス概要 3' 
        }
    ];

    // 事例紹介用の画像
    const caseStudyImages = [
        { 
            url: 'images/case-1.jpg', 
            alt: '導入事例 1' 
        },
        { 
            url: 'images/case-2.jpg', 
            alt: '導入事例 2' 
        },
        { 
            url: 'images/case-3.jpg', 
            alt: '導入事例 3' 
        }
    ];

    useEffect(() => {
        const initialMessage = `ninben.ai へようこそ！
AI技術を活用して、あなたのビジネスをサポートします。
サービスについて詳しく知りたい方は、下記のクイックリプライボタンをご利用ください。`;

        setMessages([{ role: 'assistant', content: initialMessage }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '') return;

        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');

        // サービス概要または事例に関する質問かチェック
        const isServiceQuery = input.includes('サービス概要') || input.includes('ninben.aiについて');
        const isCaseStudyQuery = input.includes('導入事例') || input.includes('事例');
        
        setShowCarousel(isServiceQuery || isCaseStudyQuery);

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
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.answer,
                showImages: isServiceQuery || isCaseStudyQuery,
                imageType: isServiceQuery ? 'service' : 'case'
            }]);
        } catch (error) {
            console.error('エラー:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
            }]);
            setShowCarousel(false);
        } finally {
            setIsLoading(false);
        }
    };

    const quickReplies = [
        { label: 'サービス概要', content: 'ninben.aiのサービス概要を教えてください' },
        { label: '料金プラン', content: '料金プランについて教えてください' },
        { label: '導入事例', content: '導入事例を教えてください' },
        { label: 'お問い合わせ', content: 'お問い合わせ方法を教えてください' }
    ];

    return (
        <div className="container">
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">ninben.ai</h1>
                </div>
                <div className="card-content">
                    {messages.map((msg, index) => (
                        <div key={index}>
                            <div className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                                {msg.content}
                            </div>
                            {msg.showImages && (
                                <div className="carousel-wrapper">
                                    <ImageCarousel 
                                        images={msg.imageType === 'service' ? serviceImages : caseStudyImages} 
                                    />
                                </div>
                            )}
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
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);


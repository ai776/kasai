document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');
    
    // カードクリック時のインタラクション
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // リンクがある場合はそちらを優先
            const link = this.querySelector('a');
            if (link) {
                return; // リンクのクリックに委ねる
            }
            
            const title = this.querySelector('h3').textContent;
            const description = this.querySelector('p').textContent;
            
            // 簡単なアラートで詳細を表示（実際のプロジェクトでは詳細ページに遷移）
            alert(`${title}\n\n${description}\n\n詳細ページを実装予定です。`);
        });
        
        // カードのホバーエフェクト用のイベントリスナー
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
    });
    
    // カードの遅延表示アニメーション
    function animateCards() {
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    // ページ読み込み時にアニメーション実行
    animateCards();
    
    // レスポンシブ対応：ウィンドウリサイズ時の処理
    window.addEventListener('resize', function() {
        // 必要に応じてレイアウト調整
    });
});
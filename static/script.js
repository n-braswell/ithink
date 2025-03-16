class Writer {
    constructor() {
        this.sentences = [];
        this.currentIndex = 0;
        this.display = document.getElementById('sentence-display');
        this.input = document.getElementById('sentence-input');
        this.isTransitioning = false;
        this.setupEventListeners();
        this.loadText();
        this.autoSaveInterval = setInterval(() => this.saveText(), 3000);
        this.adjustTextareaHeight();
    }

    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('input', () => this.adjustTextareaHeight());
        window.addEventListener('resize', () => this.adjustTextareaHeight());
    }

    handleKeydown(e) {
        if (this.isTransitioning) {
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = this.input.value.trim();
            if (text) {
                this.addSentence(text);
                this.input.value = '';
                this.adjustTextareaHeight();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateSentences(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateSentences(1);
        }
    }

    adjustTextareaHeight() {
        this.input.style.height = 'auto';
        this.input.style.height = this.input.scrollHeight + 'px';
    }

    async loadText() {
        try {
            const response = await fetch('https://ithink-37ij.onrender.com/load');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.text) {
                this.sentences = data.text
                    .split(/(?<=[.!?])\s+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                this.currentIndex = this.sentences.length;
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error loading text:', error);
            // Silently fail - don't disrupt the user experience
        }
    }

    async saveText() {
        if (this.sentences.length === 0) return;

        try {
            const response = await fetch('https://ithink-37ij.onrender.com/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: this.sentences.join(' '),
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
        } catch (error) {
            console.error('Error saving text:', error);
            // Silently fail - don't disrupt the user experience
        }
    }

    addSentence(text) {
        this.sentences.splice(this.currentIndex, 0, text);
        this.currentIndex++;
        this.animateTransition(() => {
            this.updateDisplay();
        });
        this.saveText();
    }

    navigateSentences(direction) {
        const newIndex = this.currentIndex + direction;
        if (newIndex >= 0 && newIndex <= this.sentences.length) {
            this.currentIndex = newIndex;
            this.animateTransition(() => {
                this.updateDisplay();
            });
        }
    }

    animateTransition(callback) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.display.classList.add('fade-out');
        
        setTimeout(() => {
            callback();
            this.display.classList.remove('fade-out');
            this.display.classList.add('fade-in');
            
            setTimeout(() => {
                this.isTransitioning = false;
                this.display.classList.remove('fade-in');
            }, 300);
        }, 300);
    }

    updateDisplay() {
        if (this.currentIndex < this.sentences.length) {
            this.display.textContent = this.sentences[this.currentIndex];
        } else {
            this.display.textContent = '';
        }
        this.input.value = '';
        this.adjustTextareaHeight();
    }
}

// Initialize the writer when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new Writer();
}); 
class Writer {
    constructor() {
        this.sentences = [];
        this.currentIndex = 0;
        this.display = document.getElementById('sentence-display');
        this.input = document.getElementById('sentence-input');
        this.setupEventListeners();
        this.loadText();
        this.autoSaveInterval = setInterval(() => this.saveText(), 3000);
    }

    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = this.input.value.trim();
                if (text) {
                    this.addSentence(text);
                    this.input.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSentences(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateSentences(1);
            }
        });
    }

    async loadText() {
        try {
            const response = await fetch('https://ithink-37ij.onrender.com/load');
            const data = await response.json();
            if (data.text) {
                this.sentences = data.text.split(/[.!?]+/).filter(s => s.trim());
                this.currentIndex = this.sentences.length;
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error loading text:', error);
        }
    }

    async saveText() {
        try {
            await fetch('https://ithink-37ij.onrender.com/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: this.sentences.join('. ') + '.',
                }),
            });
        } catch (error) {
            console.error('Error saving text:', error);
        }
    }

    addSentence(text) {
        this.sentences.splice(this.currentIndex, 0, text);
        this.currentIndex++;
        this.updateDisplay();
        this.saveText();
    }

    navigateSentences(direction) {
        const newIndex = this.currentIndex + direction;
        if (newIndex >= 0 && newIndex <= this.sentences.length) {
            this.display.classList.add('fade-out');
            setTimeout(() => {
                this.currentIndex = newIndex;
                this.updateDisplay();
                this.display.classList.remove('fade-out');
            }, 150);
        }
    }

    updateDisplay() {
        if (this.currentIndex < this.sentences.length) {
            this.display.textContent = this.sentences[this.currentIndex];
        } else {
            this.display.textContent = '';
        }
    }
}

new Writer(); 
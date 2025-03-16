class Writer {
    constructor() {
        this.paragraphs = [[]];  // Array of paragraph arrays
        this.currentParagraph = 0;
        this.currentIndex = 0;
        this.display = document.getElementById('sentence-display');
        this.textContainer = document.getElementById('sentence-text');
        this.input = document.getElementById('sentence-input');
        this.isTransitioning = false;
        this.setupIndicators();
        this.setupEventListeners();
        this.loadText();
        this.autoSaveInterval = setInterval(() => this.saveText(), 3000);
        this.adjustTextareaHeight();
        this.setupHotkeyHelper();
        this.setupParagraphIndicators();
        this.updateHotkeyHelper();
        this.previewPanel = document.getElementById('preview-panel');
        this.previewContent = this.previewPanel.querySelector('.preview-content');
        this.isPanelOpen = false;
    }

    setupIndicators() {
        // Remove indicators from sentence-display and add directly to body
        this.beforeIndicators = document.createElement('div');
        this.beforeIndicators.className = 'sentence-indicators-before';
        
        this.afterIndicators = document.createElement('div');
        this.afterIndicators.className = 'sentence-indicators-after';
        
        // Append to body instead of this.display
        document.body.appendChild(this.beforeIndicators);
        document.body.appendChild(this.afterIndicators);
    }

    updateIndicators() {
        console.log('Current state:', {
            sentences: this.paragraphs[this.currentParagraph],
            currentIndex: this.currentIndex
        });

        // Clear existing indicators
        this.beforeIndicators.innerHTML = '';
        this.afterIndicators.innerHTML = '';

        // Add indicators for sentences before current
        const beforeCount = this.currentIndex;
        if (beforeCount > 0) {
            for (let i = 0; i < beforeCount; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'sentence-indicator';
                indicator.style.opacity = Math.max(0.05, 0.15 - (i * 0.015));
                this.beforeIndicators.appendChild(indicator);
            }
        }

        // Add indicators for sentences after current
        // Only show after indicators if we're not at the last sentence
        // AND we're not at the input position
        const isAtLastSentence = this.currentIndex >= this.paragraphs[this.currentParagraph].length - 1;
        if (!isAtLastSentence && this.currentIndex < this.paragraphs[this.currentParagraph].length) {
            const afterCount = Math.min(this.paragraphs[this.currentParagraph].length - this.currentIndex - 1, 10);
            for (let i = 0; i < afterCount; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'sentence-indicator';
                indicator.style.opacity = Math.max(0.05, 0.15 - (i * 0.015));
                this.afterIndicators.appendChild(indicator);
            }
        }
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

        // Move Ctrl+P check to the top to ensure it's caught first
        if (e.ctrlKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            this.createNewParagraph();
            return;
        }

        if (e.ctrlKey && (e.key === '[' || e.key === ']')) {
            e.preventDefault();
            const direction = e.key === '[' ? -1 : 1;
            const newParagraph = this.currentParagraph + direction;
            
            if (newParagraph >= 0 && newParagraph < this.paragraphs.length) {
                this.navigateToParagraph(newParagraph);
            }
            return;
        }

        // Handle Ctrl + D (delete current line)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (this.currentIndex < this.paragraphs[this.currentParagraph].length) {
                this.paragraphs[this.currentParagraph].splice(this.currentIndex, 1);
                // If we're at the end after deletion, move back one
                if (this.currentIndex >= this.paragraphs[this.currentParagraph].length) {
                    this.currentIndex = Math.max(0, this.paragraphs[this.currentParagraph].length - 1);
                }
                this.animateTransition(() => {
                    this.updateDisplay();
                    if (this.currentIndex < this.paragraphs[this.currentParagraph].length) {
                        this.input.value = this.paragraphs[this.currentParagraph][this.currentIndex];
                        this.adjustTextareaHeight();
                    }
                    this.saveText();
                });
            }
            return;
        }

        // Handle Ctrl + B (jump to bottom)
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            const lastIndex = this.paragraphs[this.currentParagraph].length;
            if (this.currentIndex !== lastIndex) {
                this.currentIndex = lastIndex;
                this.animateTransition(() => {
                    this.updateDisplay();
                    this.input.value = '';
                    this.adjustTextareaHeight();
                });
            }
            return;
        }

        // Handle Ctrl + T (jump to top)
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            if (this.currentIndex !== 0) {
                this.currentIndex = 0;
                this.animateTransition(() => {
                    this.updateDisplay();
                    if (this.paragraphs[this.currentParagraph].length > 0) {
                        this.input.value = this.paragraphs[this.currentParagraph][0];
                        this.adjustTextareaHeight();
                    }
                });
            }
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = this.input.value.trim();
            
            // If we're editing an existing line and it's now empty, treat as deletion
            if (this.currentIndex < this.paragraphs[this.currentParagraph].length && text === '') {
                // Use the existing delete line logic
                this.paragraphs[this.currentParagraph].splice(this.currentIndex, 1);
                // If we're at the end after deletion, move back one
                if (this.currentIndex >= this.paragraphs[this.currentParagraph].length) {
                    this.currentIndex = Math.max(0, this.paragraphs[this.currentParagraph].length - 1);
                }
                this.animateTransition(() => {
                    this.updateDisplay();
                    if (this.currentIndex < this.paragraphs[this.currentParagraph].length) {
                        this.input.value = this.paragraphs[this.currentParagraph][this.currentIndex];
                        this.adjustTextareaHeight();
                    }
                    this.saveText();
                });
                return;
            }

            // Only add/update if there's actual text
            if (text) {
                if (this.currentIndex < this.paragraphs[this.currentParagraph].length) {
                    // Update existing sentence
                    this.paragraphs[this.currentParagraph][this.currentIndex] = text;
                    this.currentIndex++;
                } else {
                    // Add new sentence
                    this.addSentence(text);
                }
                
                // Clear input and force immediate height adjustment
                this.input.value = '';
                this.input.style.height = 'auto';
                
                // Force immediate indicator update
                requestAnimationFrame(() => {
                    this.adjustTextareaHeight();
                    this.updateDisplay();
                    this.updateIndicators();
                });
                
                this.saveText();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateSentences(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateSentences(1);
        }

        // Add preview panel toggle (Ctrl + V)
        if (e.ctrlKey && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            this.togglePreviewPanel();
            return;
        }
    }

    adjustTextareaHeight() {
        requestAnimationFrame(() => {
            this.input.style.height = 'auto';
            this.input.style.height = this.input.scrollHeight + 'px';
            // Force indicator update after height adjustment
            this.updateIndicators();
        });
    }

    async loadText() {
        this.paragraphs = [[]];
        this.currentParagraph = 0;
        this.currentIndex = 0;
        this.updateDisplay();
    }

    async saveText() {
        if (this.paragraphs.length === 0) return;

        try {
            const response = await fetch('https://ithink-37ij.onrender.com/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: this.paragraphs.map(paragraph => paragraph.join(' ')).join('\n'),
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
        } catch (error) {
            console.error('Error saving text:', error);
            // Silently fail - don't disrupt the user experience
        }
    }

    addSentence(text) {
        this.paragraphs[this.currentParagraph].splice(this.currentIndex, 0, text);
        this.currentIndex++;
        
        // Force immediate updates
        requestAnimationFrame(() => {
            this.updateDisplay();
            this.updateIndicators();
            if (this.isPanelOpen) {
                this.updatePreviewContent();
            }
        });
    }

    navigateSentences(direction) {
        const newIndex = this.currentIndex + direction;
        if (newIndex >= 0 && newIndex <= this.paragraphs[this.currentParagraph].length) {
            // Animate text out
            const textElement = direction < 0 ? this.input : this.textContainer;
            textElement.classList.add(direction < 0 ? 'text-move-down' : 'text-move-up');
            
            setTimeout(() => {
                // Remove old indicators
                this.beforeIndicators.innerHTML = '';
                this.afterIndicators.innerHTML = '';
                
                this.currentIndex = newIndex;
                
                // Update display and animate new indicators
                this.updateDisplay();
                const allIndicators = document.querySelectorAll('.sentence-indicator');
                allIndicators.forEach(indicator => {
                    indicator.classList.add('indicator-animate');
                });

                // Update input value and remove animation classes
                if (this.currentIndex === this.paragraphs[this.currentParagraph].length) {
                    this.input.value = '';
                } else {
                    this.input.value = this.paragraphs[this.currentParagraph][this.currentIndex];
                }
                this.adjustTextareaHeight();
                
                textElement.classList.remove('text-move-up', 'text-move-down');
            }, 300);
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
            }, 400);
        }, 400);
    }

    updateDisplay() {
        if (this.currentIndex < this.paragraphs[this.currentParagraph].length) {
            this.textContainer.textContent = '';  // Clear the display text since it's in the input
        } else {
            this.textContainer.textContent = '';
        }
        this.updateIndicators();
    }

    setupHotkeyHelper() {
        const helper = document.getElementById('hotkey-helper');
        const hotkeys = [
            { combo: 'Ctrl + D', action: 'Delete Line' },
            { combo: 'Ctrl + B', action: 'Jump to Bottom' },
            { combo: 'Ctrl + T', action: 'Jump to Top' },
            { combo: 'Ctrl + P', action: 'New Paragraph' },
            { combo: 'Ctrl + [', action: 'Previous Paragraph' },
            { combo: 'Ctrl + ]', action: 'Next Paragraph' },
            { combo: 'Ctrl + V', action: 'Toggle Preview' }
        ];

        // Clear existing items
        helper.innerHTML = '';

        // Create hotkey items
        hotkeys.forEach(hotkey => {
            const item = document.createElement('div');
            item.className = 'hotkey-item';
            item.innerHTML = `
                <span class="hotkey-combo">${hotkey.combo}</span>
                <span class="hotkey-action">${hotkey.action}</span>
            `;
            helper.appendChild(item);
        });

        // Show/hide helper on Ctrl key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control') {
                helper.style.opacity = '1';
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                helper.style.opacity = '0';
            }
        });

        // Hide helper when window loses focus
        window.addEventListener('blur', () => {
            helper.style.opacity = '0';
        });
    }

    setupParagraphIndicators() {
        this.paragraphContainer = document.getElementById('paragraph-indicators');
        this.updateParagraphIndicators();
    }

    updateParagraphIndicators() {
        this.paragraphContainer.innerHTML = '';
        this.paragraphs.forEach((paragraph, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'paragraph-indicator';
            if (index === this.currentParagraph) {
                indicator.classList.add('active');
            }
            
            // Add click handler for navigation
            indicator.addEventListener('click', () => {
                this.navigateToParagraph(index);
            });
            
            // Add animation class for new indicators
            indicator.classList.add('indicator-animate');
            
            this.paragraphContainer.appendChild(indicator);
        });
    }

    navigateToParagraph(index) {
        if (index === this.currentParagraph) return;
        
        this.currentParagraph = index;
        this.currentIndex = 0;  // Go to first sentence of paragraph
        this.animateTransition(() => {
            this.updateDisplay();
            if (this.paragraphs[this.currentParagraph].length > 0) {
                this.input.value = this.paragraphs[this.currentParagraph][0];
            } else {
                this.input.value = '';
            }
            this.adjustTextareaHeight();
            this.updateParagraphIndicators();
        });
    }

    createNewParagraph() {
        // Add console.log for debugging
        console.log('Creating new paragraph');
        
        // Create new paragraph after current one
        this.paragraphs.splice(this.currentParagraph + 1, 0, []);
        this.currentParagraph++;
        this.currentIndex = 0;
        this.input.value = '';
        
        this.animateTransition(() => {
            this.updateDisplay();
            this.updateParagraphIndicators();
        });
    }

    updateHotkeyHelper() {
        const hotkeys = [
            { combo: 'Ctrl + D', action: 'Delete Line' },
            { combo: 'Ctrl + B', action: 'Jump to Bottom' },
            { combo: 'Ctrl + T', action: 'Jump to Top' },
            { combo: 'Ctrl + P', action: 'New Paragraph' },
            { combo: 'Ctrl + [', action: 'Previous Paragraph' },
            { combo: 'Ctrl + ]', action: 'Next Paragraph' },
            { combo: 'Ctrl + V', action: 'Toggle Preview' }
        ];
        // ... update helper with new hotkeys ...
    }

    togglePreviewPanel() {
        this.isPanelOpen = !this.isPanelOpen;
        this.previewPanel.classList.toggle('open');
        
        if (this.isPanelOpen) {
            this.updatePreviewContent();
        }
    }

    updatePreviewContent() {
        this.previewContent.innerHTML = '';
        
        this.paragraphs.forEach((paragraph, index) => {
            const paragraphDiv = document.createElement('div');
            paragraphDiv.className = 'preview-paragraph';
            
            // Join sentences with proper spacing
            const paragraphText = paragraph
                .map(sentence => sentence.trim())
                .join(' ');
                
            paragraphDiv.textContent = paragraphText;
            this.previewContent.appendChild(paragraphDiv);
        });
    }
}

// Initialize the writer when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new Writer();
}); 
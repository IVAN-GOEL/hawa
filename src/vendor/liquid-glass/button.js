export class Button {
  constructor(options = {}) {
    this.options = {
      text: '',
      size: 'medium', // 'small' | 'medium' | 'large'
      type: 'pill',
      onClick: null,
      ...options,
    };

    this.domElement = document.createElement('button');
    this.domElement.className = 'liquid-glass-button';
    this.domElement.innerText = this.options.text;

    if (this.options.onClick) {
      this.domElement.addEventListener('click', this.options.onClick);
    }
  }

  setText(newText) {
    this.options.text = newText;
    this.domElement.innerText = newText;
  }

  destroy() {
    if (this.options.onClick) {
      this.domElement.removeEventListener('click', this.options.onClick);
    }
    if (this.domElement.parentElement) {
      this.domElement.parentElement.removeChild(this.domElement);
    }
  }
}

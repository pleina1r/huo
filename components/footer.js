class MyFooter extends HTMLElement {

  connectedCallback() {
    this.render();
  }

  render() {
    const text = this.getAttribute('text') ? this.getAttribute('text') + ' | © 2026 huo.cafe' : '© 2026 huo.cafe';
    this.innerHTML = `
      <div class="footer">
        <p>${text}</p>
      </div>
    `;
  }
}

customElements.define('main-footer', MyFooter);

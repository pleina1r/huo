class MyNavbar extends HTMLElement {

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="head_wrapper">
      <div id="navbar" class="navbar">
        <div class="glass button logo">
          <a href="index.html">藿</a>
        </div>
        <div id="main_buttons">
          <div class="dropdown">
            <div class="glass button">
              <img class="static_icon" width="16px" height="16px" style="padding-right: 5px;" src="icons/drill.png" /><span data-i18n="tools" id="tools"></span>
            </div>
            <div class="dropdown_wrapper">
              <div class="glass dropdown_content">
                <div class="dropdown_element">
                  <img class="static_icon" width="16px" height="16px" style="padding-right: 5px;" src="icons/clock.png" />
                  <a href="epoch_conv.html" data-i18n="timestamps"></a>
                </div>
                <div class="dropdown_element">
                  <img class="static_icon" width="16px" height="16px" style="padding-right: 5px;" src="icons/notepad.png" />
                  <a href="notepad.html" data-i18n="notepad"></a>
                </div>
              </div>
            </div>
          </div>
          <div class="glass button">
            <span data-i18n="about"></span>
          </div>
        </div>
        <c-dropdown class="language_selector" data="🇺🇸">
            <span>🇨🇳</span>
          </c-dropdown>
      </div>
      <div class="dropdown theme_selector">
          <div class="glass button">
            <img id="selected_theme_icon" src="icons/clock.png" width="24" height="24"/>
            <span id="selected_theme_name">?</span>
          </div>
            <div class="dropdown_wrapper">
              <div id="theme_dropdown" class="glass dropdown_content">
              </div>
            </div>
          </div>
      </div>
      
    </div>
    `;
  }
}

customElements.define('main-nav', MyNavbar);

if (!customElements.get('c-dropdown')) {
    class Dropdown extends HTMLElement {
        constructor() {
            super();
            this._open = false;
            this._options = []; // strings
            this._justClosed = false; // flag to prevent immediate reopening on hover
            // Render into light DOM so global styles (index.css) apply. do not attach a shadow root.
            // this.attachShadow({ mode: 'open' });
            this._onDocumentClick = this._onDocumentClick.bind(this);
            this._onKeyDown = this._onKeyDown.bind(this);
            this._onMouseEnter = this._onMouseEnter.bind(this);
            this._onMouseLeave = this._onMouseLeave.bind(this);
            
            // default onchange function
            this.onchange = function(value) {
                console.log('Dropdown value changed to:', value);
            };
        }

        connectedCallback() {
            // gather options from light dom children (if any), then clear children
            const lightChildren = Array.from(this.children).filter(node => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''));
            this._options = lightChildren.map(c => c.innerHTML.trim());
            // clear light DOM so user-provided spans don't appear twice
            this.innerHTML = '';

            // initial selected value: attribute 'data' or dataset.value or first option or empty
            const initial = this.getAttribute('data') || this.dataset.value || this._options[0] || '';

            // ensure dataset.value reflects initial
            this.dataset.value = initial;

            // store the initial value so it doesn't get lost
            this._initialValue = initial;

            // render into light DOM using navbar-compatible structure
            this._render(initial);

            // event handlers
            this._selectedButton.addEventListener('click', () => this.toggle());
            this._optionsContent.addEventListener('click', (e) => {
                const target = e.target.closest('.dropdown_element');
                if (!target) return;
                this._selectOption(target);
            });

            this._selectedButton.addEventListener('keydown', this._onKeyDown);
            this._optionsContent.addEventListener('keydown', this._onKeyDown);

            // add mouse event listeners to handle hover behavior
            this.addEventListener('mouseenter', this._onMouseEnter);
            this.addEventListener('mouseleave', this._onMouseLeave);

            document.addEventListener('click', this._onDocumentClick);
        }

        disconnectedCallback() {
            document.removeEventListener('click', this._onDocumentClick);
            this.removeEventListener('mouseenter', this._onMouseEnter);
            this.removeEventListener('mouseleave', this._onMouseLeave);
            if (this._selectedButton) this._selectedButton.removeEventListener('keydown', this._onKeyDown);
            if (this._optionsContent) this._optionsContent.removeEventListener('keydown', this._onKeyDown);
        }

        // public value getter/setter
        get value() {
            return this.dataset.value;
        }
        set value(v) {
            this.dataset.value = String(v);
            if (this._selectedButton) this._selectedButton.querySelector('.label').innerHTML = this.dataset.value;
            this._reRenderOptions();
        }

        toggle() {
            this._open = !this._open;
            // toggle an 'open' class on the host so hover rules can be simulated programmatically
            this.classList.toggle('open', this._open);
            // also toggle wrapper visibility
            const wrapper = this.querySelector('.c-dropdown-wrapper');
            if (wrapper) wrapper.classList.toggle('open', this._open);
            if (this._selectedButton) this._selectedButton.setAttribute('aria-expanded', String(this._open));
            if (this._open) {
                // focus first option for keyboard navigation
                const first = this.querySelector('.dropdown_element');
                if (first) first.focus();
            } else {
                if (this._selectedButton) this._selectedButton.focus();
            }
        }

        _onDocumentClick(e) {
            if (!this.contains(e.target)) {
                if (this._open) this.toggle();
            }
        }

        _onMouseEnter(e) {
            // Don't open on hover if we just closed it
            if (this._justClosed) return;
            if (!this._open) {
                this._open = true;
                this.classList.add('open');
                const wrapper = this.querySelector('.c-dropdown-wrapper');
                if (wrapper) wrapper.classList.add('open');
            }
        }

        _onMouseLeave(e) {
            // Clear the justClosed flag when mouse leaves
            this._justClosed = false;
            this.classList.remove('just-closed');
            if (this._open) {
                this._open = false;
                this.classList.remove('open');
                const wrapper = this.querySelector('.c-dropdown-wrapper');
                if (wrapper) wrapper.classList.remove('open');
            }
        }

        _onKeyDown(e) {
            const KEY = {
                ENTER: 'Enter',
                SPACE: ' ',
                SPACE2: 'Spacebar',
                ARROW_DOWN: 'ArrowDown',
                ARROW_UP: 'ArrowUp',
                ESC: 'Escape',
                TAB: 'Tab'
            };
            switch (e.key) {
                case KEY.ENTER:
                case KEY.SPACE:
                case KEY.SPACE2:
                    e.preventDefault();
                    if (e.target === this._selectedButton) this.toggle();
                    else if (e.target.classList.contains('dropdown_element')) this._selectOption(e.target);
                    break;
                case KEY.ARROW_DOWN:
                    e.preventDefault();
                    this._focusNextOption(1);
                    break;
                case KEY.ARROW_UP:
                    e.preventDefault();
                    this._focusNextOption(-1);
                    break;
                case KEY.ESC:
                    if (this._open) this.toggle();
                    break;
                case KEY.TAB:
                    if (this._open) this.toggle();
                    break;
            }
        }

        _focusNextOption(direction) {
            const opts = Array.from(this.querySelectorAll('.dropdown_element'));
            if (!opts.length) return;
            const active = document.activeElement;
            let idx = opts.indexOf(active);
            if (idx === -1) idx = 0;
            idx = (idx + direction + opts.length) % opts.length;
            opts[idx].focus();
        }

        _selectOption(optionEl) {
            const newValue = optionEl.innerHTML.trim();
            const oldValue = this.dataset.value || '';

            // Update the selected value
            this.dataset.value = newValue;
            if (this._selectedButton) this._selectedButton.querySelector('.label').innerHTML = newValue;

            // Re-render the options to include the previously selected value
            this._reRenderOptions();

            // dispatch change event
            this.dispatchEvent(new CustomEvent('change', {
                detail: { value: newValue },
                bubbles: true,
                composed: true
            }));

            // Call the onchange function
            if (typeof this.onchange === 'function') {
                this.onchange(newValue);
            }

            // close the dropdown and remove hover state
            this._open = false;
            this.classList.remove('open');
            this.classList.add('just-closed');
            const wrapper = this.querySelector('.c-dropdown-wrapper');
            if (wrapper) wrapper.classList.remove('open');
            if (this._selectedButton) this._selectedButton.setAttribute('aria-expanded', 'false');

            // Set flag to prevent immediate reopening on hover
            this._justClosed = true;

            // Clear the just-closed state after a short delay to allow normal hover behavior
            setTimeout(() => {
                this._justClosed = false;
                this.classList.remove('just-closed');
            }, 150);
        }

        _reRenderOptions() {
            // Get all possible options: initial value + all original options
            const currentValue = this.dataset.value;
            const allOptions = [this._initialValue, ...this._options].filter((opt, idx, arr) => {
                // Remove duplicates and exclude the currently selected value
                return opt !== currentValue && arr.indexOf(opt) === idx;
            });

            // Rebuild the options HTML
            const optionsHtml = allOptions.map(opt => {
                return `<span tabindex="0" class="dropdown_element">${opt}</span>`;
            }).join('');

            // Update the options content
            if (this._optionsContent) {
                this._optionsContent.innerHTML = optionsHtml;
            }
        }

        _render(selected) {
            // Self-contained CSS scoped to the custom element tag `c-dropdown` so the drawer is hidden
            // until host is hovered or opened programmatically.
            const style = `
                c-dropdown {
                  display: inline-flex;
                  align-items: center;
                  position: relative; /* important so the absolute drawer is positioned to the host */
                }

                /* the visible button area */
                c-dropdown .glass.button {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer; /* clickable button */
                }

                /* wrapper holds the drawer and is absolute so it does not affect layout */
                c-dropdown .c-dropdown-wrapper {
                  position: absolute;
                  top: 100%;
                  width: 100%;
                  pointer-events: none;
                  opacity: 1;
                  z-index: 9999;
                  padding-top: 10px; /* space between button and drawer */
                }

                c-dropdown:hover .c-dropdown-wrapper {
                    pointer-events: auto;
                }

                c-dropdown .c-dropdown-content {
                  visibility: hidden;
                  opacity: 0;
                  transform: translateY(-6px);
                  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
                  pointer-events: none;
                  position: relative;
                  color: var(--text);
                }


                /* dropdown elements layout */
                c-dropdown .c-dropdown-content .dropdown_element {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 10px;
                    white-space: nowrap;
                    cursor: pointer;
                }

                /* show drawer on host hover or when open class is present */
                c-dropdown:hover .c-dropdown-content,
                c-dropdown.open .c-dropdown-content,
                c-dropdown .c-dropdown-content.open {
                  visibility: visible;
                  opacity: 1;
                  transform: translateY(0);
                  pointer-events: auto;
                }
                
                /* prevent hover from opening when just closed */
                c-dropdown.just-closed:hover .c-dropdown-content {
                  visibility: hidden;
                  opacity: 0;
                  transform: translateY(-6px);
                  pointer-events: none;
                }

                c-dropdown.just-closed:hover .c-dropdown-wrapper {
                  pointer-events: none;
                }
            `;

            // Build options list using previously gathered this._options
            const optionsHtml = this._options.map(opt => {
                return `<span tabindex="0" class="dropdown_element">${opt}</span>`;
            }).join('');


            const html = `
                <style>${style}</style>
                <div class="glass button">
                    <span class="label">${selected}</span>
                </div>
                <div class="c-dropdown-wrapper">
                    <div class="glass c-dropdown-content">
                        ${optionsHtml}
                    </div>
                </div>
            `;

            this.innerHTML = html;

            // keep references
            this._selectedButton = this.querySelector('.glass.button');
            this._optionsContent = this.querySelector('.c-dropdown-content');
        }
    }

    customElements.define('c-dropdown', Dropdown);
}
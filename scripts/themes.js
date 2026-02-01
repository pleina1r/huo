class Theme {
    constructor(name, icon, bg, text, glass, img_filter) {
        this.name = name;
        this.icon = icon;
        this.bg = bg;
        this.text = text;
        this.glass = glass;
        this.img_filter = img_filter;
    }
}

// https://codepen.io/sosuke/full/Pjoqqp
// img filter generator

const themes = [
    new Theme(
        "Huo", 
        ["icons/huotheme.png", 24, 24],
        "#4e6151", 
        "#fefae0", 
        "#ffffff", 
        "invert(94%) sepia(7%) saturate(1214%) hue-rotate(325deg) brightness(107%) contrast(103%)"
    ),
    new Theme(
        "Manhattan",
        ["icons/manhattantheme.webp", 20, 28], 
        "#2d2a32", 
        "#fefae0", 
        "#ffdd00", 
        "invert(94%) sepia(7%) saturate(1214%) hue-rotate(325deg) brightness(107%) contrast(103%)"
    )
]

document.addEventListener('DOMContentLoaded', () => {
    loadThemes();
})
function loadThemes() {
    let active_theme = localStorage.getItem("theme");
    active_theme ??= "Huo";
    localStorage.setItem("theme", active_theme); // to set a default value if undef
    themes.forEach(theme => {
        if((theme.name) == active_theme) {
            // actually activate the theme
            let e_name = document.getElementById("selected_theme_name");
            let e_icon = document.getElementById("selected_theme_icon");

            e_name.innerText = theme.name;
            e_icon.setAttribute("src", theme.icon[0]);
            e_icon.setAttribute("width", theme.icon[1]);
            e_icon.setAttribute("length", theme.icon[2]);

            const root = document.documentElement;
            root.style.setProperty('--bg', theme.bg);
            root.style.setProperty('--text', theme.text);
            root.style.setProperty('--glass', theme.glass);
            root.style.setProperty('--img_filter', theme.img_filter);
        }
        else {
            // load theme dropdown items
            let dropdown = document.getElementById("theme_dropdown");
            // reset all items (because loadThemes() can be called at times other than load)
            for(i = 0; i < dropdown.children.length; i++) {
                dropdown.removeChild(dropdown.children[i]);
            }

            let dropdown_element = document.createElement("div");
            dropdown_element.className = "dropdown_element";
            dropdown_element.innerHTML = `
            <img class="theme_list_icon" src="${theme.icon[0]}" width="${theme.icon[1]}" height="${theme.icon[2]}">
            <span class="theme_list_name">${theme.name}</span>
            `
            dropdown_element.addEventListener('click', (e) => {
                // there are a few clickable things in the dropdown element
                let theme = e.target.getElementsByClassName("theme_list_name")
                theme = (theme[0] ? theme [0].innerText : e.target.innerText); 
                theme == "" ? theme = e.target.parentNode.children[1].innerText : true;
                
                localStorage.setItem("theme", theme);
                loadThemes();
            })
            dropdown.appendChild(dropdown_element);

        }
    })

}
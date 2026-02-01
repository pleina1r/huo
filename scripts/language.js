// global variables for language packs
const languageFiles = ['en', 'cn']; 
const languagePacks = [];

document.addEventListener('DOMContentLoaded', () => {

    // load current language
    const savedLanguage = localStorage.getItem('language') || 'en';
    const flag = savedLanguage === 'cn' ? '🇨🇳' : '🇺🇸';

    // load all language packs
    Promise.all(languageFiles.map(file => 
        fetch(`language_packs/${file}.json`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            languagePacks.push(data);
        })
        .catch(error => {
            console.error(`Error loading ${file}:`, error);
        })
    )).then(() => {
        console.log('Loaded language packs:', languagePacks);
        loadLanguage();
    });
    
    // initialize the language selector
    const languageSelector = document.querySelector('.language_selector');
    languageSelector.onchange = function (value) {
        console.log('Language changed to:', value);
        const currentLang = value;
        switch (currentLang) {
            case '🇺🇸':
                localStorage.setItem('language', 'en');
                loadLanguage(languagePacks[0]);
                break;
            case '🇨🇳':
                localStorage.setItem('language', 'cn');
                loadLanguage(languagePacks[1]);
                break;
            default:
                console.warn('Unknown language selected:', currentLang);
        }
    };

    languageSelector.value = flag;
    

});

// load each language section

function loadLanguage(pack) {
    if (languagePacks.length === 0) return;

    if (!pack) {
        const savedLanguage = localStorage.getItem('language') || 'en';
        let idx = languageFiles.indexOf(savedLanguage);
        pack = languagePacks[idx];
    }

    let keys = Object.keys(pack);
    pack = Object.values(pack);
    console.log(pack);
    for (let i = 0; i < pack.length; i++) {
        let section = pack[i];
        console.log(`Loading section:`, keys[i]);
        if(!document.getElementById(keys[i])) {
            console.warn(`Section element with id ${keys[i]} not found`);
            continue;
        }
        let section_element = document.getElementById(keys[i]);
        console.log(section_element);
        for (let j = 0; j < section.length; j++) {
            let item = section[j];
            console.log(`Setting ${item.key} to ${item.value}`);
            let elements = section_element.querySelectorAll(`[data-i18n='${item.key}']`);
            elements.forEach(el => {
                el.innerText = item.value;
            });
            

        }
    }
    document.dispatchEvent(new CustomEvent('languageChanged'));
}

function getTranslation(section, key) {
    if (languagePacks.length === 0) return 'New Note'; // default fallback
    const savedLanguage = localStorage.getItem('language') || 'en';
    let idx = languageFiles.indexOf(savedLanguage);
    let pack = languagePacks[idx];
    if (!pack || !pack[section]) return key;
    let items = pack[section];
    let item = items.find(i => i.key === key);
    return item ? item.value : key;
}
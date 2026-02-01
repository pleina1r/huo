// update note every time something's added
addEventListener("keydown", (event) => { 
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        document.execCommand('insertLineBreak');
    }

    if (event.key == 'Tab') { // tab key
        event.preventDefault();
        document.execCommand('insertHTML', false, '&#009');
    }

})

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById("note_box").addEventListener("input", updateStorage)

    

    let active_note = localStorage.getItem("active_note");
    if(active_note == null) {
        localStorage.setItem("active_note", 0);
        active_note = 0;
    }
    

    // always paste as plaintext
    let editableDiv = document.querySelector('div[contenteditable="true"]');
    editableDiv.addEventListener("paste", function(e) {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        if (document.execCommand) {
            document.execCommand("insertText", false, text);
        } else {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            selection.deleteFromDocument();
            selection.getRangeAt(0).insertNode(document.createTextNode(text));
        }
    })

    
    loadNotes();

    var colorPicker = new iro.ColorPicker("#color_picker", {
        width: 200
    });

    // suppress flag to avoid reacting to programmatic updates
    let suppressColorChange = false;

     colorPicker.on('color:change', function(color) {
        if (suppressColorChange) return;
        // 1. update the ui variable (for your css styling)
        const root = document.documentElement;
        root.style.setProperty("--picker_color", color.hexString);
        
        // 2. apply the color to the document
        // this handles both highlighting text and changing color at the caret
        applyFormat('color', color.hexString);
        updateStorage();
    });


    document.addEventListener('selectionchange', () => {
    const noteBox = document.getElementById("note_box");
    
    if (document.activeElement === noteBox) {
        const props = getCurrentCaretProperties();
        if (!props) return;

        // 1. Update Color Picker
        if (colorPicker && props.color) {
            // prevent the picker change event from firing its handler while we programmatically set the color
            suppressColorChange = true;
            colorPicker.color.hexString = props.color;
            suppressColorChange = false;
            // update your css variable for the ui if necessary
            document.documentElement.style.setProperty("--picker_color", props.color);
        }

        // 2. Update Font Size Dropdown (if you have one)
        const sizeSelector = document.getElementById("font_size_select");
        if (sizeSelector) {
            sizeSelector.value = parseInt(props.fontSize); // "16px" -> 16
        }

        // 3. Update Toggle Buttons (e.g., Bold/Italic)
        const italicBtn = document.getElementById("italic_btn");
        if (italicBtn) {
            italicBtn.classList.toggle("active", props.fontStyle === "italic");
        }

        const boldBtn = document.getElementById("bold_btn");
        if (boldBtn) {
            boldBtn.classList.toggle("active", props.fontWeight === "bold" || parseInt(props.fontWeight) >= 700);
        }

        const underlineBtn = document.getElementById("underline_btn");
        if (underlineBtn) {
            underlineBtn.classList.toggle("active", props.textDecoration.includes("underline"));
        }
        
        console.log("Caret Styles:", props);
    }
});
    
    window.addEventListener('resize', reorganizeTabs);
})

function getAvailableTabWidth() {
    let row = document.getElementById('note_header_row');
    if (!row) return 0;
    let rect = row.getBoundingClientRect();
    let button = document.getElementById('new_note_btn_td');
    let buttonWidth = 0;
    return rect.width - buttonWidth;
}

function getTabWidth(title) {
    let temp = document.createElement('div');
    temp.className = 'glass button header_minimized';
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    let button = document.createElement('button');
    button.className = 'astext';
    let span = document.createElement('span');
    span.className = 'note_title';
    span.textContent = title;
    button.appendChild(span);
    temp.appendChild(button);
    document.body.appendChild(temp);
    let width = temp.getBoundingClientRect().width;
    document.body.removeChild(temp);
    return width;
}

function canDelete() {
    let btn = document.getElementById("delete_button");
    if(getNoteCount() == 1) {     
        btn.disabled = true;
    } else {
        btn.disabled = false;
    }
}

function updateStorage() {
    let notes = getNotes();
    let idx = localStorage.getItem("active_note");
    let noteBox = document.getElementById("note_box");
    if (idx !== null && notes) {
        notes[idx].content = noteBox.innerHTML;
        setNotes(notes);
    }
}

function setNotes(notes) {
    localStorage.setItem("notes", JSON.stringify(notes));
}

function getNoteCount() {
    return getNotes().length;
}

function getNotes() {
    let stored = localStorage.getItem("notes");
    if (!stored) return [{title: getTranslation('notepad', 'new_note'), content: ""}];
    let parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        // convert old format (array of strings) to new format (array of objects)
        parsed = parsed.map(content => ({title: getTranslation('notepad', 'new_note'), content}));
    }
    return parsed;
}

/// returns a note's table
function getTableByNote(idx) {
    let tables = document.getElementsByClassName("note_table");
    for (let table of tables) {
        let row = table.children[0];
        for (let td of row.children) {
            if (td.id == idx) return row;
        }
    }
    return null;
}

/// just so i dont have to type this so much
function getTableIdxByNote(idx) {
    let tables = document.getElementsByClassName("note_table");
    for (let i = 0; i < tables.length; i++) {
        let row = tables[i].children[0];
        for (let td of row.children) {
            if (td.id == idx) return i;
        }
    }
    return -1;
}

/// todo: load notes from local storage
function loadNotes() {
    let notes = getNotes();
    if (notes.length === 0) { 
        notes = [{title: getTranslation('notepad', 'new_note'), content: ""}]; 
        setNotes(notes); 
    }
    // load each note's tab
    for(let i = 0; i < notes.length; i++) {
        makeNewNote(false, i);
    }
    let active_note = localStorage.getItem("active_note");
    activateTab(active_note);
}

function refreshNotes() {
    let new_btn = document.getElementById("new_note_btn_td");
    document.documentElement.appendChild(new_btn);
    Array.from(document.getElementsByClassName("note_table")).forEach(t => {
        t.remove();
    })
    loadNotes();
}


/// loads the specified note
function loadNote(idx) {
    let notes = getNotes();
    let note_box = document.getElementById("note_box");
    // load text
    note_box.innerHTML = notes[idx].content;
    // move cursor to end
    note_box.focus();
    const range = document.createRange();
    range.selectNodeContents(note_box);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    // move new button to end (for table switches)
    let new_btn = document.getElementById("new_note_btn_td");
    let table = getTableByNote(idx);
    table.appendChild(new_btn);

    canDelete();

    // Set the title in the input and header
    notes[idx].title = notes[idx].title.substring(0, 32); // Ensure title is capped
    document.getElementById("note_title_input").value = notes[idx].title;
    let tab = document.getElementById(idx);
    let note_title = tab.querySelector('.note_title');
    note_title.textContent = notes[idx].title;
    note_title.removeAttribute("data-i18n"); // Prevent translation from overriding the title

    console.log(`Loaded note ${idx} from table ${getTableIdxByNote(idx)}`)
}

/// creates a new note tab.
function makeNewNote(activate, idx) {
    // make structure
    let td = document.createElement("div");
        td.id = `${idx}`
    let header_minimized = document.createElement("div");
        header_minimized.className = "glass button header_minimized";
    let button = document.createElement("button");
        button.className = "astext";
        button.setAttribute("onclick", "activateTab(this.parentNode.parentNode.id)");
    let note_title = document.createElement("span");
        note_title.className = "note_title";
        note_title.textContent = getNotes()[idx].title.substring(0, 32);
        note_title.removeAttribute("data-i18n");
    button.appendChild(note_title)
    header_minimized.appendChild(button);
    td.appendChild(header_minimized);
    // adjust active note table
    let tables = document.getElementsByClassName("note_table");
    let table_idx = tables.length - 1;
    if (table_idx < 0) {
        table_idx = 0;
        newTable();
    } else {
        let table = tables[table_idx];
        let row = table.children[0];
        let tabs = row.children;
        let sum = 0;
        for (let tab of tabs) {
            if (tab.id !== 'new_note_btn_td') sum += tab.getBoundingClientRect().width;
        }
        let tabWidth = getTabWidth(getNotes()[idx].title.substring(0, 32));
        if (sum + tabWidth > getAvailableTabWidth()) {
            table_idx = tables.length;
            newTable();
        }
    }
    console.log("Currently appending to table: " + table_idx);
    tables = document.getElementsByClassName("note_table"); // refresh
    let active_table = tables[table_idx].children[0]
    active_table.appendChild(td);
    if(activate) { 
        activateTab(getNoteCount() - 1); 
    }

}

/// activate a tab 
function activateTab(idx) {
    console.log("Activating note: " + idx)

    const allTabs = document.querySelectorAll('.header_minimized');
    allTabs.forEach(t => {
        t.classList.remove('active');
    });
    let tab = document.getElementById(idx);
    tab.children[0].classList.add('active');
    localStorage.setItem("active_note", idx);
    activateTable(idx);
    loadNote(idx);
}

/// deletes the currently active note
function delete_note() {
    let idx = localStorage.getItem("active_note");
    let next = (idx == 0 ? 0 : idx-1)
    localStorage.setItem("active_note", next);
    let notes = getNotes();
    notes.splice(idx, 1);
    setNotes(notes);
    document.getElementById(idx).remove();
    refreshNotes();
    canDelete();
}


function newTab() {
    let notes = getNotes();
    notes.push({title: getTranslation('notepad', 'new_note'), content: "<br>"});
    setNotes(notes);
    makeNewNote(true, getNoteCount() - 1);
    canDelete();

}

function newTable() {
    let a = document.createElement("div");
        a.className = "note_table";
    let b = document.createElement("div");
        b.id = "note_header_row"
    a.appendChild(b);
    document.getElementById("notepad").appendChild(a);
    console.log("Created New Table: ");
    console.log(document.getElementById("notepad_wrapper"))
}

function activateTable(noteIdx) {
    const tables = document.getElementsByClassName("note_table");
    const noteTab = document.getElementById("note_tab");

    for (let i = 0; i < tables.length; i++) {
        let row = tables[i].children[0];
        for (let td of row.children) {
            if (td.id == noteIdx) {
                tables[i].after(noteTab);
                return;
            }
        }
    }
}

function getDefaultColor() {
    const noteBox = document.getElementById("note_box");
    const color = window.getComputedStyle(noteBox).color;
    return rgbToHex(color);
}

function applyFormat(styleProp, value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const noteBox = document.getElementById("note_box");
    if (!noteBox.contains(range.commonAncestorContainer)) return;

    let parentSpan = range.commonAncestorContainer.nodeType === 3 
                     ? range.commonAncestorContainer.parentElement 
                     : range.commonAncestorContainer;
    
    parentSpan = parentSpan.closest('span');

    // if the selection exactly matches an existing span, just update that span.
    if (!selection.isCollapsed && parentSpan && noteBox.contains(parentSpan)) {
        const fullText = parentSpan.textContent;
        const selectedText = selection.toString();

        if (fullText === selectedText) {
            parentSpan.style[styleProp] = value;
            return; 
        }
    }

    if (selection.isCollapsed) {
        const newSpan = document.createElement("span");
        newSpan.style[styleProp] = value;
        newSpan.textContent = "\u200B";
        range.insertNode(newSpan);
        
        range.setStart(newSpan.firstChild, 1);
        range.collapse(true);
    } else {
        const newSpan = document.createElement("span");
        newSpan.style[styleProp] = value;
        
        const fragment = range.extractContents();

        fragment.querySelectorAll('span').forEach(s => {
            s.style[styleProp] = '';
            if (s.getAttribute('style') === '' || s.style.length === 0) {
                const parent = s.parentNode;
                while (s.firstChild) parent.insertBefore(s.firstChild, s);
                parent.removeChild(s);
            }
        });

        newSpan.appendChild(fragment);
        range.insertNode(newSpan);
        range.selectNodeContents(newSpan);
    }

    selection.removeAllRanges();
    selection.addRange(range);
}

function toggleBold() {
    const props = getCurrentCaretProperties();
    const newWeight = (props && (props.fontWeight === 'bold' || parseInt(props.fontWeight) >= 700)) ? 'normal' : 'bold';
    applyFormat('fontWeight', newWeight);
    updateStorage();
}

function toggleItalic() {
    const props = getCurrentCaretProperties();
    const newStyle = (props && props.fontStyle === 'italic') ? 'normal' : 'italic';
    applyFormat('fontStyle', newStyle);
    updateStorage();
}

function toggleUnderline() {
    const props = getCurrentCaretProperties();
    const hasUnderline = props && props.textDecoration.includes('underline');
    const newDec = hasUnderline ? 'none' : 'underline';
    applyFormat('textDecoration', newDec);
    updateStorage();
}

function getActiveSpan() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const noteBox = document.getElementById("note_box");
    let node = range.startContainer;
    
    // find closest span
    let span = (node.nodeType === 3 ? node.parentNode : node).closest('span');

    if (!span || !noteBox.contains(span)) {
        if (noteBox.innerHTML.trim() === "" || noteBox.innerHTML === "<br>") {
            span = document.createElement('span');
            span.style.color = getDefaultColor();
            span.textContent = "\u200B";
            noteBox.innerHTML = "";
            noteBox.appendChild(span);
            
            range.setStart(span.firstChild, 1);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    return span;
}

function getCurrentCaretProperties() {
    const activeSpan = getActiveSpan();
    if (!activeSpan) return null;

    const style = window.getComputedStyle(activeSpan);

    return {
        color: rgbToHex(style.color),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight, // e.g., "bold" or "700"
        fontStyle: style.fontStyle,   // e.g., "italic"
        textDecoration: style.textDecoration,
        fontFamily: style.fontFamily.replace(/['"]/g, '') // Clean quotes from font names
    };
}

function rgbToHex(rgb) {
    const match = rgb.match(/\d+/g);
    if (!match) return "#000000";
    return "#" + match.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function closePicker() {
    let picker = document.getElementById("color_picker_wrapper");
    picker.style.visibility = "hidden";
}

function openPicker() {
    let picker = document.getElementById("color_picker_wrapper");
    picker.style.visibility = "visible";
}

function download_note() {
    let noteBox = document.getElementById("note_box");
    let text = noteBox.innerText;
    let blob = new Blob([text], { type: "text/plain" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "note.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

}

function reorganizeTabs() {
    let notes = getNotes();
    // Move new_btn to a safe place to avoid it being removed with tables
    let new_btn = document.getElementById("new_note_btn_td");
    if (new_btn) document.documentElement.appendChild(new_btn);
    // Remove all tables except the first
    let tables = Array.from(document.getElementsByClassName("note_table"));
    for (let i = 1; i < tables.length; i++) {
        tables[i].remove();
    }
    // Clear the first table's row
    let firstTable = tables[0];
    if (firstTable) {
        let row = firstTable.children[0];
        let children = Array.from(row.children);
        for (let child of children) {
            if (child.id !== 'new_note_btn_td') {
                child.remove();
            }
        }
    } else {
        // If no tables, create one
        newTable();
        tables = document.getElementsByClassName("note_table");
        firstTable = tables[0];
    }
    // Re-add all tabs
    for (let i = 0; i < notes.length; i++) {
        makeNewNote(false, i);
    }
    // Activate the current active note
    let active_note = localStorage.getItem("active_note");
    activateTab(active_note);
}

function update_note_title() {
    let idx = localStorage.getItem("active_note");
    let notes = getNotes();
    let input = document.getElementById("note_title_input");
    input.value = input.value.substring(0, 32); // Cap at 32 characters
    notes[idx].title = input.value;
    setNotes(notes);
    // Update the header
    let tab = document.getElementById(idx);
    let note_title = tab.querySelector('.note_title');
    note_title.textContent = input.value;
    note_title.removeAttribute("data-i18n");
    reorganizeTabs();
    // Refocus on the title input after reorganization
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function updateDefaultTitles() {
    let notes = getNotes();
    let defaultTitle = getTranslation('notepad', 'new_note');
    for (let i = 0; i < notes.length; i++) {
        if (notes[i].title === 'New Note' || notes[i].title === '新笔记') {
            notes[i].title = defaultTitle;
        }
    }
    setNotes(notes);
    // Also update the displayed titles
    for (let i = 0; i < notes.length; i++) {
        let tab = document.getElementById(i);
        if (tab) {
            let note_title = tab.querySelector('.note_title');
            if (note_title && (note_title.textContent === 'New Note' || note_title.textContent === '新笔记')) {
                note_title.textContent = defaultTitle;
            }
        }
    }
    // Update the input if active
    let active_note = localStorage.getItem("active_note");
    if (active_note !== null && (notes[active_note].title === 'New Note' || notes[active_note].title === '新笔记')) {
        document.getElementById("note_title_input").value = defaultTitle;
    }
}

document.addEventListener('languageChanged', updateDefaultTitles);
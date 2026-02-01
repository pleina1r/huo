function convertTimezoneOffset(offset) {
    // thanks @andrewchilds
    const plusMinus = offset > 0 ? '-' : '+';
    const hours = Math.abs(Math.ceil(offset / 60)) + '';
    const minutes = (Math.abs(offset) % 60) + '';

    return `${plusMinus}${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

window.onload = function () {
    let year = document.getElementById("year");
    let month = document.getElementById("month");
    let day = document.getElementById("day");
    let hour = document.getElementById("hour");
    let minute = document.getElementById("minute");

    // set all of these to current date/time
    let now = new Date();
    
    year.value = now.getFullYear();
    month.value = (now.getMonth() + 1).toString().padStart(2, '0');
    day.value = now.getDate().toString().padStart(2, '0');
    hour.value = now.getHours().toString().padStart(2, '0');
    minute.value = now.getMinutes().toString().padStart(2, '0');

    // add onchange listener to timezone dropdown
    let tzDropdown = document.getElementById("tz");
    tzDropdown.onchange = function(value) {
        convert();
    };

    // initial conversion
    convert();

    // add input validation for numeric fields
    [year, month, day, hour, minute].forEach(input => {
        input.addEventListener('input', function() {
            // remove non-numeric characters
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // trigger conversion on input change
            convert();
        });
        
        // add blur validation for clamping and padding
        input.addEventListener('blur', function() {
            let num = parseInt(this.value) || 0;
            
            if (this.id === 'year') {
                if (num > 9999) num = 9999;
                if (num < 1900) num = 1900;
                this.value = num.toString();
            } else if (this.id === 'month') {
                if (num > 12) num = 12;
                if (num < 1) num = 1;
                this.value = num.toString().padStart(2, '0');
            } else if (this.id === 'day') {
                if (num > 31) num = 31;
                if (num < 1) num = 1;
                this.value = num.toString().padStart(2, '0');
            } else if (this.id === 'hour') {
                if (num > 23) num = 23;
                this.value = num.toString().padStart(2, '0');
            } else if (this.id === 'minute') {
                if (num > 59) num = 59;
                this.value = num.toString().padStart(2, '0');
            }
        });
    });
}


function convert() {
    let year = document.getElementById("year").value;
    let month = document.getElementById("month").value;
    let day = document.getElementById("day").value;
    let hour = document.getElementById("hour").value;
    let minute = document.getElementById("minute").value;
    let tz = document.getElementById("tz").dataset.value;

    // validate inputs
    let y = parseInt(year), m = parseInt(month), d = parseInt(day), h = parseInt(hour), min = parseInt(minute);
    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h) || isNaN(min)) {
        document.getElementById("result").innerText = "Please enter valid numbers";
        return;
    }

    // Create date object based on timezone selection
    let date;
    if (tz === "UTC") {
        date = new Date(Date.UTC(y, m - 1, d, h, min));
    } else {
        let dateString = `${year.padStart(4,'0')}-${month.padStart(2,'0')}-${day.padStart(2,'0')}T${hour.padStart(2,'0')}:${minute.padStart(2,'0')}:00`;
        date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
        document.getElementById("result").innerText = "Invalid date";
        return;
    }

    let epoch = date.getTime() / 1000;

    // should be formatted as follows;
    // <EPOCH>
    // UTC: <WKDAY>, <YYYY>/<MM>/<DD> <HH>:<MM> <TZ>
    // Local: <WKDAY>, <YYYY>/<MM>/<DD> <HH>:<MM> <TZ>
    // Relative: <X> days/hours/minutes ago/from now
    // example:
    // 1633072800
    // utc: wednesday, 2021/10/01 00:00 utc+00:00
    // local: tuesday, 2021/09/30 17:00 utc-07:00
    // relative: 2 days ago

    let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    let utc_string, local_string;
    if (tz === "UTC") {
        // inputs are utc, so utc_string reflects input exactly
        let inputDate = new Date(Date.UTC(y, m - 1, d, h, min));
        utc_string = `<span data-i18n=${days[inputDate.getUTCDay()]}></span>, ${y}/${month.padStart(2,'0')}/${day.padStart(2,'0')} ${hour.padStart(2,'0')}:${minute.padStart(2,'0')} UTC+00:00`;
        // local_string is the local time corresponding to this UTC
        local_string = `<span data-i18n=${days[date.getDay()]}></span>, ${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')} UTC${convertTimezoneOffset(date.getTimezoneOffset())}`;
    } else {
        // Inputs are local, so local_string reflects input exactly
        local_string = `<span data-i18n=${days[date.getDay()]}></span>, ${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')} UTC${convertTimezoneOffset(date.getTimezoneOffset())}`;
        // utc_string is the UTC time corresponding to this local
        utc_string = `<span data-i18n=${days[date.getUTCDay()]}></span>, ${date.getUTCFullYear()}/${(date.getUTCMonth()+1).toString().padStart(2,'0')}/${date.getUTCDate().toString().padStart(2,'0')} ${date.getUTCHours().toString().padStart(2,'0')}:${date.getUTCMinutes().toString().padStart(2,'0')} UTC+00:00`;
    }
    
    // Calculate relative time
    let now = new Date();
    let diffMs = date.getTime() - now.getTime();
    let diffSec = diffMs / 1000;
    let absDiffSec = Math.abs(diffSec);
    
    let relDays = Math.floor(absDiffSec / (60 * 60 * 24));
    let relHours = Math.floor(absDiffSec / (60 * 60));
    let relMinutes = Math.floor(absDiffSec / 60);
    
    let relative = "";
    if (relDays >= 1) {
        let unit = relDays === 1 ? '<span data-i18n="day"></span>' : '<span data-i18n="day">day</span><span data-i18n="plural"></span>';
        relative = `${relDays} ${unit}`;
    } else if (relHours >= 1) {
        let unit = relHours === 1 ? '<span data-i18n="hour">hour</span>' : '<span data-i18n="hour">hour</span><span data-i18n="plural"></span>';
        relative = `${relHours} ${unit}`;
    } else {
        let unit = relMinutes === 1 ? '<span data-i18n="minute"></span>' : '<span data-i18n="minute"></span><span data-i18n="plural"></span>';
        relative = `${relMinutes} ${unit}`;
    }
    
    if (diffSec < 0) {
        relative += '<span data-i18n="ago">ago</span>';
    } else {
        relative += '<span data-i18n="from_now">from now</span>';
    }
    
    let string = `
        <span data-i18n="timestamp"></span>: ${epoch} <br> 
        <span data-i18n="utc">UTC</span>: ${utc_string} <br>
        <span data-i18n="local">Local</span>: ${local_string} <br>
        <span data-i18n="relative">Relative</span>: ${relative} <br>
    `

    document.getElementById("result").innerHTML = string;
    loadLanguage();
}


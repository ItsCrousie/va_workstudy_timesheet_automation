/* ============================== */
/* VA Workstudy Automation Script */
/* ============================== */
/*
  Needs Calendar API and Google Sheets API Permissions to run
*/

/* Admin Data */
const unityId = "btcrouse";       // User Data
const initials = "BTC";            // Initials for timesheet
const calendarName = "VA Workstudy"; // Calendar name
const eventName = "🪖 Work: MVS"; // Name of your "Work" event
const headerBGColor = "#CC0000";

/* VA Federal Workstudy Maxima */
const HOURLY_WAGE = 7.25 // Currently federal minimum wage--2026 btw.
const MAX_HOURS = 50;  // Max hours per pay period
const MAX_DAYS = 14;   // Max days per pay period

/* Semester Dates */
  // Dates are 0-indexed, meaning January is 0 and December is 11
const semesterStartDate = new Date(2026, 0, 12); // Jan 12, 2026
const semesterEndDate = new Date(2026, 4, 6);    // May 6, 2026

/* ====================== */
/* Main Function to Run   */
/* ====================== */
function convertCalendarToSheets() {
  const payPeriods = importCalendarEvents();
  if (payPeriods && payPeriods.length > 0) {
    mapPayPeriodsToSheets(payPeriods);
  } else {
    Logger.log("No pay periods found. Nothing to write.");
  }
}

/* ====================== */
/* Import Calendar Events */
/* ====================== */
function importCalendarEvents() {

  /* Calendar API to pull all events during the semester that are "🪖 Work: MVS" */
  const calendar = CalendarApp.getCalendarsByName(calendarName)[0];
  if (!calendar) {
    Logger.log(`Calendar "${calendarName}" not found.`);
    return [];
  }

  const events = calendar.getEvents(semesterStartDate, semesterEndDate, { search: eventName });

  if (events.length === 0) {
    Logger.log("No events found.");
    return [];
  }

  /* Sort events chronologically */
  events.sort((a, b) => a.getStartTime() - b.getStartTime());

  /* Build Pay Periods */
  const payPeriods = [];
  let periodIndex = 1;
  let currentPeriod = {
    startDate: events[0].getStartTime(),
    endDate: null,
    totalHours: 0,
    events: []
  };
  let cumulativeHours = 0;

  events.forEach(event => {
    const eventStart = event.getStartTime();
    const eventEnd = event.getEndTime();

    /* Convert from calendar time to hours */
    const hours = Math.ceil((eventEnd - eventStart) / (1000 * 60 * 60));
    const daysElapsed = (eventStart - currentPeriod.startDate) / (1000 * 60 * 60 * 24);

    /* Check if current pay period should end */
    if (currentPeriod.totalHours + hours > MAX_HOURS || daysElapsed >= MAX_DAYS) {
      currentPeriod.endDate = currentPeriod.events.length
        ? currentPeriod.events[currentPeriod.events.length - 1].end
        : eventStart;
      payPeriods.push(currentPeriod);

      // Start new period
      periodIndex += 1;
      currentPeriod = {
        startDate: eventStart,
        endDate: null,
        totalHours: 0,
        events: []
      };
    }

    /* Add event to current period */
    cumulativeHours += hours;
    currentPeriod.events.push({
      date: eventStart,
      start: eventStart,
      end: eventEnd,
      hours: hours,
      cumulative: cumulativeHours
    });
    currentPeriod.totalHours += hours;
  });

  /* Push the last incomplete period */
  if (currentPeriod.events.length > 0) {
    currentPeriod.endDate = currentPeriod.events[currentPeriod.events.length - 1].end;
    payPeriods.push(currentPeriod);
  }

  return payPeriods;
}

/* ========================== */
/* Build Timesheets in Sheets */
/* ========================== */
function mapPayPeriodsToSheets(payPeriods) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  payPeriods.forEach((period, index) => {
    const sheetName = unityId + "_PP" + (index + 1) + "_" + formatDate(period.startDate);
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    } else {
      sheet.clear();
    }

    /* Build header row */
    buildHeaderRow(sheet);

    /* Group events by date for split shifts */
    const groupedByDate = {};
    period.events.forEach(ev => {
      const dateKey = formatDate(ev.date);
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { hours: 0, events: [] };
      }
      groupedByDate[dateKey].hours += ev.hours;
      groupedByDate[dateKey].events.push(ev);
    });

    /* Prepare rows: one per date, cumulative sums */
    const rows = [];
    let cumulative = 0;
    Object.keys(groupedByDate)
      .sort()
      .forEach(dateKey => {
        const dayData = groupedByDate[dateKey];
        cumulative += dayData.hours;
        rows.push([
          dateKey,
          dayData.hours.toFixed(2),
          cumulative.toFixed(2),
          initials
        ]);
      });

    /* Write all rows at once */
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }

    const totalIncome = (period.totalHours * HOURLY_WAGE).toFixed(2);
    const totalRowIndex = rows.length + 2; // +2 because headers are in row 1
    sheet.getRange(totalRowIndex, 1).setValue("TOTAL EARNED");
    sheet.getRange(totalRowIndex, 2).setValue("$" + totalIncome);
    sheet.getRange(totalRowIndex, 2).setFontWeight("bold")

    Logger.log(`Generated sheet: ${sheetName} with ${rows.length} rows.`);
  });
}

/* Header Row Helper Function */
function buildHeaderRow(sheet) {
  const headers = ["DATE", "NO. OF HOURS", "CUMULATIVE\nTO DATE", "Initials"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground(headerBGColor);
  sheet.setColumnWidths(1, headers.length, 120);
}

/* Date Format Helper Function */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}


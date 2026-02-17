# VA Workstudy Timesheet Automation

Automate the generation of timesheets for VA Federal Workstudy students by extracting your work events from Google Calendar and populating a Google Sheet with pay period summaries, cumulative hours, and total earnings.

This script is tailored for the VA Workstudy program but can be customized for similar work-study or hourly work tracking needs.

---

## Features

- Automatically pulls events from a designated Google Calendar.
- Splits events into pay periods based on federal workstudy maxima:
  - Maximum hours per pay period
  - Maximum days per pay period
- Calculates cumulative hours and total earnings per pay period.
- Generates a Google Sheet for each pay period with a clean header and formatted data.
- Handles split shifts within the same day.

---

## Requirements

- Google Workspace account with:
  - Google Calendar API access
  - Google Sheets API access
- Events in the calendar named according to your work shifts (default: `🪖 Work: MVS`)
- Adjust semester start and end dates in the script.

---

## Setup

1. **Copy the Script**
   - Open Google Sheets → Extensions → Apps Script.
   - Paste the script into the editor.

2. **Configure the Script**
   - Update the following constants at the top of the script:
     ```javascript
     const unityId = "your_unity_id";
     const initials = "Your Initials";
     const calendarName = "VA Workstudy";
     const eventName = "🪖 Work: MVS";
     const semesterStartDate = new Date(YYYY, MM, DD);
     const semesterEndDate = new Date(YYYY, MM, DD);
     ```
   - Adjust `HOURLY_WAGE`, `MAX_HOURS`, and `MAX_DAYS` if needed.

3. **Authorize APIs**
   - The first time you run the script, Google will request authorization to access your Calendar and Sheets.

4. **Run the Script**
   - Use `convertCalendarToSheets()` to generate your pay period sheets automatically.

---

## Output

- A Google Sheet will be created per pay period, named like:
  [UNITY_ID]\_PP[Number]\_[Start Date]
- Each sheet includes:
  - **DATE**: Day of the work event
  - **NO. OF HOURS**: Hours worked that day
  - **CUMULATIVE TO DATE**: Running total of hours worked
  - **Initials**: Your initials
  - Total earnings are calculated at the bottom of each sheet.

---

## Notes

- Hours are rounded up to the nearest whole hour.
- Pay periods split automatically if maximum hours or days are reached.
- Header row background color and other formatting can be customized in the script.

---

## License

This project is open-source. Feel free to use and modify for your work-study tracking needs.



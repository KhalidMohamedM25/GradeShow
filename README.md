# Algorithm Analysis and Design – Student Grade Lookup Portal

A static website for GitHub Pages with a Google Apps Script endpoint that looks up one student record by Student ID.

## Important privacy limitation

This version intentionally has **no authentication**. Anyone who knows or guesses a Student ID may be able to view that student's grades. The script returns one matching record rather than the whole class dataset, but this is not strong access control. Use only if the course/institution accepts this risk. For confidential grades, add authentication or a private access code validated server-side.

## Files

- `index.html` – portal page
- `style.css` – responsive styling
- `script.js` – lookup form and results rendering
- `backend/Code.gs` – Google Apps Script backend
- `sample-grades.xlsx` – fictional example workbook (not real student data)

## Architecture

GitHub Pages serves the frontend. Google Apps Script reads a private Google Sheet and returns only the row matching the requested Student ID. The browser does not download the complete class dataset.

Google Apps Script works most simply with Google Sheets. Import the Excel workbook into Google Sheets and keep that spreadsheet private. If you must keep Excel as the only source, you will need a separate synchronization/import process or a backend that can securely read the Excel file.

## 1. Prepare the grade sheet

Import `sample-grades.xlsx` into Google Sheets, or create a Google Sheet with a tab named `Grades`. The first row must contain these headers:

`StudentID | StudentName | Quiz | QuizMax | Assignment | AssignmentMax | Midterm | MidtermMax | Practical | PracticalMax | FinalExam | FinalExamMax | Total | MaxTotal | Percentage | Feedback`

- Format `StudentID` as **Plain text** before entering IDs, especially IDs with leading zeros.
- Keep the spreadsheet private; do not share it publicly.
- Replace fictional sample rows with your authorized course data.
- Ensure each StudentID is unique.
- Blank assessment cells are treated as “Not published.”
- Assessment maximums can be set per row using the `*Max` columns.

## 2. Deploy Google Apps Script

1. Open the Google Sheet.
2. Select **Extensions → Apps Script**.
3. Replace the editor contents with `backend/Code.gs`.
4. Save the project.
5. Confirm `SHEET_NAME = "Grades"` and that the headers match your sheet.
6. In the Apps Script editor, choose **Deploy → New deployment**.
7. Select **Web app**.
8. Set **Execute as** to **Me**.
9. Set access to **Anyone** if the no-login public lookup is required and permitted by your institution.
10. Deploy and complete Google's authorization flow.
11. Copy the deployed web app URL ending in `/exec`.

Google may change the wording of deployment options. If your organization disables public Apps Script web apps, ask its administrator for an approved alternative.

## 3. Configure the frontend

Open `script.js` and replace:

`PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`

with the deployed `/exec` URL, for example:

`https://script.google.com/macros/s/DEPLOYMENT_ID/exec`

Save the file.

## 4. Publish on GitHub Pages

1. Create a new GitHub repository, for example `algorithm-analysis-grade-portal`.
2. Upload `index.html`, `style.css`, and `script.js` to the repository root.
3. Do **not** upload real student data or credentials.
4. Open **Settings → Pages**.
5. Choose deployment from the `main` branch and the `/ (root)` folder.
6. Save and wait for GitHub Pages to publish.
7. Open the published website URL and test a known sample Student ID.

The Apps Script file is deployed separately; GitHub Pages does not execute it.

## 5. Updating grades

1. Update the private Google Sheet with the new grades.
2. Keep the column headers unchanged.
3. Reload the portal and search again. The Apps Script reads the sheet at request time, so routine grade updates do not require a frontend redeployment.
4. If you change the Apps Script code, deploy a new version of the web app when required.

## 6. Test checklist

- [ ] Existing Student ID returns only that student's record.
- [ ] Unknown ID displays a not-found message.
- [ ] Empty ID is rejected.
- [ ] IDs with leading zeros are preserved.
- [ ] Blank grades display as “Not published.”
- [ ] Duplicate IDs trigger an error.
- [ ] Mobile layout is usable.
- [ ] Print report works.
- [ ] The GitHub repository contains no real grades.
- [ ] The Google Sheet remains private.
- [ ] The public endpoint's Student-ID-only privacy limitation is understood.

## Troubleshooting

- **Service not configured:** confirm `API_URL` in `script.js`.
- **No grades found:** check the exact StudentID value and ensure it is stored as text.
- **Configuration error:** confirm the tab name and required headers.
- **Service unavailable:** confirm the Apps Script deployment URL and access settings.
- **CORS or redirect problems:** use the deployed Apps Script `/exec` URL, not the editor URL. Test in the deployed site and review Apps Script execution logs.

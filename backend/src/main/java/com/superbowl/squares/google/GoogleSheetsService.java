package com.superbowl.squares.google;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.*;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

@Service
public class GoogleSheetsService {

        // Appends a new owner row to the Owners sheet: [email, password, profiles..., payment method, identifier]
        public void appendOwnerRow(String spreadsheetId, String sheetName, String email, String password, List<String> profileNames, String paymentMethod, String identifier) throws Exception {
            Sheets service = getSheetsService();
            // Prepare row: A=email, B=password, C:L=profiles (up to 10), M=payment method, N=identifier
            List<Object> row = new java.util.ArrayList<>();
            row.add(email);
            row.add(password);
            if (profileNames != null) {
                for (int i = 0; i < 10; i++) {
                    row.add(i < profileNames.size() ? profileNames.get(i) : "");
                }
            } else {
                for (int i = 0; i < 10; i++) row.add("");
            }
            row.add(paymentMethod != null ? paymentMethod : "");
            row.add(identifier != null ? identifier : "");
            List<List<Object>> values = java.util.Collections.singletonList(row);
            // Find next available row (append)
            ValueRange body = new ValueRange().setValues(values);
            service.spreadsheets().values().append(spreadsheetId, sheetName + "!A:N", body)
                .setValueInputOption("RAW").setInsertDataOption("INSERT_ROWS").execute();
            logger.info("Appended owner row to sheet {}: {}", sheetName, row);
        }
    private static final Logger logger = LoggerFactory.getLogger(GoogleSheetsService.class);

    // Update a single cell using row/col (0,0 = F6)
    public void updateCell(String spreadsheetId, String sheetName, int row, int col, String value) throws Exception {
        logger.info("Updating single cell (preserving formatting): spreadsheetId={}, sheetName={}, row={}, col={}, value={}", spreadsheetId, sheetName, row, col, value);
        Sheets service = getSheetsService();

        // Get the sheetId (not the name) for batchUpdate
        Integer sheetId = getSheetId(service, spreadsheetId, sheetName);
        if (sheetId == null) throw new IllegalArgumentException("Sheet name not found: " + sheetName);

        int baseCol = 6; // F
        int baseRow = 6; // 6
        int a1Col = baseCol + col;
        int a1Row = baseRow + row;

        com.google.api.services.sheets.v4.model.GridRange gridRange = new com.google.api.services.sheets.v4.model.GridRange()
            .setSheetId(sheetId)
            .setStartRowIndex(a1Row - 1)
            .setEndRowIndex(a1Row)
            .setStartColumnIndex(a1Col - 1)
            .setEndColumnIndex(a1Col);

        if (value == null || value.isEmpty()) {
            // Explicitly clear the cell
            com.google.api.services.sheets.v4.model.Request clearRequest = new com.google.api.services.sheets.v4.model.Request()
            .setUpdateCells(new com.google.api.services.sheets.v4.model.UpdateCellsRequest()
                .setRange(gridRange)
                .setFields("userEnteredValue"));
            com.google.api.services.sheets.v4.model.BatchUpdateSpreadsheetRequest batchRequest = new com.google.api.services.sheets.v4.model.BatchUpdateSpreadsheetRequest()
            .setRequests(Collections.singletonList(clearRequest));
            service.spreadsheets().batchUpdate(spreadsheetId, batchRequest).execute();
            logger.info("Cell cleared in Google Sheets API.");
        } else {
            com.google.api.services.sheets.v4.model.CellData cellData = new com.google.api.services.sheets.v4.model.CellData()
            .setUserEnteredValue(new com.google.api.services.sheets.v4.model.ExtendedValue().setStringValue(value));
            com.google.api.services.sheets.v4.model.RepeatCellRequest repeatCellRequest = new com.google.api.services.sheets.v4.model.RepeatCellRequest()
            .setRange(gridRange)
            .setCell(cellData)
            .setFields("userEnteredValue");
            com.google.api.services.sheets.v4.model.BatchUpdateSpreadsheetRequest batchRequest = new com.google.api.services.sheets.v4.model.BatchUpdateSpreadsheetRequest()
            .setRequests(Collections.singletonList(
                new com.google.api.services.sheets.v4.model.Request().setRepeatCell(repeatCellRequest)
            ));
            service.spreadsheets().batchUpdate(spreadsheetId, batchRequest).execute();
            logger.info("Single cell batchUpdate request sent to Google Sheets API (formatting preserved).");
        }
    }

    // Helper to get sheetId from sheet name
    private Integer getSheetId(Sheets service, String spreadsheetId, String sheetName) throws Exception {
        Sheets.Spreadsheets.Get request = service.spreadsheets().get(spreadsheetId);
        request.setFields("sheets.properties");
        Spreadsheet ss = request.execute();
        for (Sheet s : ss.getSheets()) {
            if (sheetName.equals(s.getProperties().getTitle())) {
                return s.getProperties().getSheetId();
            }
        }
        return null;
    }

    // F6 is (0,0). F is col 5 (A=1, F=6), 6 is row 6 (1-based)
    private static String a1FromRowCol(int row, int col) {
        int baseCol = 6; // F
        int baseRow = 6; // 6
        int a1Col = baseCol + col;
        int a1Row = baseRow + row;
        return colToLetter(a1Col) + a1Row;
    }

    // 1-based col to letter (A=1, Z=26, AA=27, etc)
    private static String colToLetter(int col) {
        StringBuilder sb = new StringBuilder();
        while (col > 0) {
            int rem = (col - 1) % 26;
            sb.insert(0, (char)('A' + rem));
            col = (col - 1) / 26;
        }
        return sb.toString();
    }
    private static final String APPLICATION_NAME = "SuperBowlSquares";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
        private static final String CREDENTIALS_RESOURCE_PATH = "google/client_secret_132614767954-oiilm5bdn4o6m2mu6pt5edgm901guhj7.apps.googleusercontent.com.json";
        private static final String TOKENS_DIRECTORY_PATH = new File(new File(GoogleSheetsService.class.getProtectionDomain().getCodeSource().getLocation().getPath()).getParentFile().getParentFile().getParentFile().getParentFile(), "backend/src/main/resources/google/tokens").getAbsolutePath();
    private static final List<String> SCOPES = Collections.singletonList(SheetsScopes.SPREADSHEETS);

    private Sheets getSheetsService() throws IOException, GeneralSecurityException {
        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        InputStream in = getClass().getClassLoader().getResourceAsStream(CREDENTIALS_RESOURCE_PATH);
        if (in == null) {
            throw new IOException("Resource not found: " + CREDENTIALS_RESOURCE_PATH);
        }
        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                JSON_FACTORY, new InputStreamReader(in));
        File tokenDir = new File(TOKENS_DIRECTORY_PATH);
        logger.info("[DEBUG] Using token directory: {} (absolute: {})", TOKENS_DIRECTORY_PATH, tokenDir.getAbsolutePath());
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                .setDataStoreFactory(new FileDataStoreFactory(tokenDir))
                .setAccessType("offline")
                .build();
        var credential = flow.loadCredential("user");
        return new Sheets.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    // Example: Read values from a sheet/tab by name
    public List<List<Object>> readSheet(String spreadsheetId, String sheetName, String range) throws Exception {
        Sheets service = getSheetsService();
        String fullRange = sheetName + "!" + range;
        ValueRange response = service.spreadsheets().values()
                .get(spreadsheetId, fullRange)
                .execute();
        return response.getValues();
    }

    // Example: Update values in a sheet/tab by name
        public void updateSheet(String spreadsheetId, String sheetName, String range, List<List<Object>> values) throws Exception {
                logger.info("Updating Google Sheet: spreadsheetId={}, sheetName={}, range={}", spreadsheetId, sheetName, range);
                logger.info("First row of values: {}", values != null && !values.isEmpty() ? values.get(0) : "<empty>");
                Sheets service = getSheetsService();
                String fullRange = sheetName + "!" + range;
                logger.info("Full range: {}", fullRange);
                ValueRange body = new ValueRange().setValues(values);
                service.spreadsheets().values()
                                .update(spreadsheetId, fullRange, body)
                                .setValueInputOption("RAW")
                                .execute();
                logger.info("Update request sent to Google Sheets API.");
        }
}

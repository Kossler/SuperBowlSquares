package com.superbowl.squares.google;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.*;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class GoogleSheetsService {

    private static final String APPLICATION_NAME = "SuperBowlSquares";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(SheetsScopes.SPREADSHEETS);

    // Cache the Sheets client (building it requires I/O + crypto + transport setup).
    private volatile Sheets sheetsService;

    // Cache sheetId lookups to avoid an extra API call for each update.
    // Key format: "<spreadsheetId>|<sheetName>" -> sheetId
    private final ConcurrentMap<String, Integer> sheetIdCache = new ConcurrentHashMap<>();

    // Reuse HTTP transport (expensive to create; safe to reuse).
    private final NetHttpTransport httpTransport;

    public GoogleSheetsService() {
        try {
            this.httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalStateException("Failed to initialize Google HTTP transport", e);
        }
    }

        // Appends a new owner row to the Owners sheet: [email, password, profiles..., payment method, identifier]
        public void appendOwnerRow(String spreadsheetId, String sheetName, String email, String password, List<String> profileNames, String paymentMethod, String identifier) throws Exception {
            Sheets service = getSheetsService();
            // Prepare row: A=email, B=password, C:L=profiles (up to 10), M=payment method, N=identifier
            List<Object> row = new ArrayList<>();
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
            logger.debug("Appended owner row to sheet {}", sheetName);
        }
    private static final Logger logger = LoggerFactory.getLogger(GoogleSheetsService.class);

    // Update a single cell using row/col (0,0 = F6)
    public void updateCell(String spreadsheetId, String sheetName, int row, int col, String value) throws Exception {
        logger.debug("Updating single cell: spreadsheetId={}, sheetName={}, row={}, col={}", spreadsheetId, sheetName, row, col);
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
            logger.debug("Cell cleared in Google Sheets API.");
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
            logger.debug("Single cell batchUpdate request sent to Google Sheets API (formatting preserved).");
        }
    }

    // Helper to get sheetId from sheet name
    private Integer getSheetId(Sheets service, String spreadsheetId, String sheetName) throws Exception {
        String cacheKey = spreadsheetId + "|" + sheetName;
        Integer cached = sheetIdCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        Sheets.Spreadsheets.Get request = service.spreadsheets().get(spreadsheetId);
        request.setFields("sheets.properties");
        Spreadsheet ss = request.execute();
        for (Sheet s : ss.getSheets()) {
            if (sheetName.equals(s.getProperties().getTitle())) {
                Integer sheetId = s.getProperties().getSheetId();
                if (sheetId != null) {
                    sheetIdCache.putIfAbsent(cacheKey, sheetId);
                }
                return sheetId;
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
    private Sheets getSheetsService() throws IOException, GeneralSecurityException {
        Sheets local = sheetsService;
        if (local != null) {
            return local;
        }

        synchronized (this) {
            local = sheetsService;
            if (local != null) {
                return local;
            }

            GoogleCredentials credentials;
            String jsonEnv = System.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON");
            if (jsonEnv != null && !jsonEnv.isBlank()) {
                try (java.io.InputStream is = new java.io.ByteArrayInputStream(jsonEnv.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
                    credentials = GoogleCredentials.fromStream(is).createScoped(SCOPES);
                }
            } else {
                // Local dev fallback
                String credentialsPath = "backend/credentials/service-account.json";
                try (java.io.InputStream is = new java.io.FileInputStream(credentialsPath)) {
                    credentials = GoogleCredentials.fromStream(is).createScoped(SCOPES);
                }
            }

            sheetsService = new Sheets.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            return sheetsService;
        }
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
            logger.debug("Updating Google Sheet: spreadsheetId={}, sheetName={}, range={}", spreadsheetId, sheetName, range);
                Sheets service = getSheetsService();
                String fullRange = sheetName + "!" + range;
                ValueRange body = new ValueRange().setValues(values);
                service.spreadsheets().values()
                                .update(spreadsheetId, fullRange, body)
                                .setValueInputOption("RAW")
                                .execute();
            logger.debug("Update request sent to Google Sheets API.");
        }
}

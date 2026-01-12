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
import com.google.api.services.sheets.v4.model.ValueRange;

import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.List;

public class GoogleSheetsWriteTest {
    private static final String CREDENTIALS_RESOURCE_PATH = "google/client_secret_132614767954-oiilm5bdn4o6m2mu6pt5edgm901guhj7.apps.googleusercontent.com.json";
    private static final String TOKENS_DIRECTORY_PATH = "backend/src/main/resources/google/tokens";
    private static final List<String> SCOPES = Collections.singletonList(SheetsScopes.SPREADSHEETS);
    private static final String SPREADSHEET_ID = "1zXue8QE0GBV5GRWv7k5JSR67yRjMf3o7Cj9egY4Fguk";
    // F6 is (0,0). We'll compute the A1 cell from row/col args.

    public static void main(String[] args) throws Exception {
        if (args.length < 3) {
            System.err.println("Usage: GoogleSheetsWriteTest <row> <col> <value>");
            System.err.println("  0,0 is F6");
            return;
        }
        int row = Integer.parseInt(args[0]);
        int col = Integer.parseInt(args[1]);
        String value = args[2];

        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

        InputStream in = GoogleSheetsWriteTest.class.getClassLoader().getResourceAsStream(CREDENTIALS_RESOURCE_PATH);
        if (in == null) {
            throw new Exception("Resource not found: " + CREDENTIALS_RESOURCE_PATH);
        }
        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                JSON_FACTORY, new InputStreamReader(in));

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
            HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
            .setDataStoreFactory(new FileDataStoreFactory(new File(TOKENS_DIRECTORY_PATH)))
            .setAccessType("offline")
            .build();
        var credential = flow.loadCredential("user");
        if (credential == null) {
            throw new Exception("No stored credential found. Run the OAuth flow first.");
        }

        Sheets service = new Sheets.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName("GoogleSheetsWriteTest")
                .build();

        // F6 is (0,0). F is column 5 (A=1, so F=6), 6 is row 6 (1-based)
        String sheet = "5A";
        String cell = a1FromRowCol(row, col);
        String range = sheet + "!" + cell;
        ValueRange body = new ValueRange().setValues(Collections.singletonList(Collections.singletonList(value)));
        service.spreadsheets().values().update(SPREADSHEET_ID, range, body)
                .setValueInputOption("RAW")
                .execute();
        System.out.println("Wrote '" + value + "' to cell " + range);
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
}

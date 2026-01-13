package com.superbowl.squares.google;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.api.services.sheets.v4.Sheets;

import java.util.Collections;
import java.util.List;

import java.io.InputStream;
import java.io.IOException;

public class GoogleSheetsAuth {
    private static final List<String> SCOPES = Collections.singletonList(SheetsScopes.SPREADSHEETS);

    public static void main(String[] args) throws Exception {
        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

        GoogleCredentials credentials = loadServiceAccountCredentials();
        Sheets sheets = new Sheets.Builder(HTTP_TRANSPORT, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                .setApplicationName("SuperBowlSquares")
                .build();

        // Lightweight sanity check: list a metadata field to prove auth works.
        // Provide spreadsheet id via env var to avoid hard-coding secrets.
        String spreadsheetId = System.getenv("GOOGLE_SHEETS_SPREADSHEET_ID");
        if (spreadsheetId == null || spreadsheetId.isBlank()) {
            System.out.println("Service account credentials loaded successfully.");
            System.out.println("Set GOOGLE_SHEETS_SPREADSHEET_ID to verify Sheets API access.");
            return;
        }

        var spreadsheet = sheets.spreadsheets().get(spreadsheetId).setFields("properties.title").execute();
        System.out.println("Authenticated successfully. Spreadsheet title: " + spreadsheet.getProperties().getTitle());
    }

    private static GoogleCredentials loadServiceAccountCredentials() throws IOException {
        String jsonEnv = System.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON");
        if (jsonEnv != null && !jsonEnv.isBlank()) {
            try (InputStream is = new java.io.ByteArrayInputStream(jsonEnv.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
                return GoogleCredentials.fromStream(is).createScoped(SCOPES);
            }
        }

        String credentialsPath = "backend/credentials/service-account.json";
        try (InputStream is = new java.io.FileInputStream(credentialsPath)) {
            return GoogleCredentials.fromStream(is).createScoped(SCOPES);
        }
    }
}

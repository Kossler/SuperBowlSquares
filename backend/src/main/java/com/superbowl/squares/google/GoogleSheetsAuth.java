package com.superbowl.squares.google;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.sheets.v4.SheetsScopes;

import java.io.File;
import java.io.FileReader;
import java.util.Collections;
import java.util.List;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;

public class GoogleSheetsAuth {
    private static final String CREDENTIALS_RESOURCE_PATH = "google/client_secret_132614767954-oiilm5bdn4o6m2mu6pt5edgm901guhj7.apps.googleusercontent.com.json";
    private static final String TOKENS_DIRECTORY_PATH = "backend/src/main/resources/google/tokens";
    private static final List<String> SCOPES = Collections.singletonList(SheetsScopes.SPREADSHEETS);

    public static void main(String[] args) throws Exception {
        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

        InputStream in = GoogleSheetsAuth.class.getClassLoader().getResourceAsStream(CREDENTIALS_RESOURCE_PATH);
        if (in == null) {
            throw new IOException("Resource not found: " + CREDENTIALS_RESOURCE_PATH);
        }
        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
            JSON_FACTORY, new InputStreamReader(in));

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                .setDataStoreFactory(new FileDataStoreFactory(new File(TOKENS_DIRECTORY_PATH)))
                .setAccessType("offline")
                .build();

        var receiver = new com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver.Builder().setPort(8888).build();
        var credential = new com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
        System.out.println("Tokens stored to: " + TOKENS_DIRECTORY_PATH);
    }
}
